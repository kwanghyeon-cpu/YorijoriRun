package com.khcompany.yorijorirun.game

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * KH Company's other apps, for the "함께 쓰면 좋은 앱" card and the game-over link. The list is a shared
 * file (https://kwanghyeon-cpu.github.io/related-apps.json, kept in the kwanghyeon-cpu.github.io repo);
 * a copy ships in assets/related-apps.json for offline use and for when the download fails.
 */
data class RelatedApp(
    val id: String,
    val name: String,
    val tagline: String,
    val packageName: String?,
    /** Listed publicly on Google Play (otherwise only the web version, if any, can be offered). */
    val public: Boolean,
    val web: String?,
    val iconUrl: String?,
)

data class RelatedAppsCatalog(
    /** Group id to the app ids in it. */
    val groups: Map<String, List<String>>,
    val apps: Map<String, RelatedApp>,
)

/** Where tapping a related app goes. */
sealed interface RelatedTarget {
    data class OpenApp(val packageName: String) : RelatedTarget
    data class Store(val packageName: String) : RelatedTarget
    data class Web(val url: String) : RelatedTarget
    data object None : RelatedTarget
}

object RelatedApps {
    const val SELF_ID = "yorijorirun"
    const val LIST_URL = "https://kwanghyeon-cpu.github.io/related-apps.json"
    private const val ASSET = "related-apps.json"
    private const val CACHE_FILE = "related-apps.json"
    private const val PREFS = "related_apps"
    private const val KEY_FETCHED_AT = "fetched_at"
    private const val DAY_MS = 24L * 60 * 60 * 1000
    private const val TIMEOUT_MS = 5000

    /**
     * The other apps in any group [selfId] belongs to, in group order without repeats, keeping only
     * the ones that have somewhere to go (a public store page or a web version).
     */
    fun siblings(catalog: RelatedAppsCatalog, selfId: String = SELF_ID): List<RelatedApp> =
        catalog.groups.values
            .filter { selfId in it }
            .flatten()
            .distinct()
            .filter { it != selfId }
            .mapNotNull { catalog.apps[it] }
            .filter { targetFor(it, installed = false) != RelatedTarget.None }

    /** Installed: open it. Public: its Play page. Otherwise its web version, or nothing. */
    fun targetFor(app: RelatedApp, installed: Boolean): RelatedTarget = when {
        installed && app.packageName != null -> RelatedTarget.OpenApp(app.packageName)
        app.public && app.packageName != null -> RelatedTarget.Store(app.packageName)
        !app.web.isNullOrBlank() -> RelatedTarget.Web(app.web)
        else -> RelatedTarget.None
    }

    fun parse(json: String): RelatedAppsCatalog {
        val root = JSONObject(json)
        val groups = LinkedHashMap<String, List<String>>()
        val groupArray = root.optJSONArray("groups")
        if (groupArray != null) {
            for (i in 0 until groupArray.length()) {
                val g = groupArray.getJSONObject(i)
                val ids = g.optJSONArray("apps") ?: continue
                groups[g.optString("id", "group$i")] = (0 until ids.length()).map { ids.getString(it) }
            }
        }
        val apps = LinkedHashMap<String, RelatedApp>()
        val appObject = root.optJSONObject("apps")
        if (appObject != null) {
            for (id in appObject.keys()) {
                val a = appObject.getJSONObject(id)
                apps[id] = RelatedApp(
                    id = id,
                    name = a.optString("name", id),
                    tagline = a.optString("tagline", ""),
                    packageName = a.optStringOrNull("package"),
                    public = a.optBoolean("public", false),
                    web = a.optStringOrNull("web"),
                    iconUrl = a.optStringOrNull("icon"),
                )
            }
        }
        return RelatedAppsCatalog(groups, apps)
    }

    private fun JSONObject.optStringOrNull(key: String): String? =
        if (isNull(key)) null else optString(key, "").ifBlank { null }

    /**
     * The catalog: the downloaded copy if it is less than a day old, else a fresh download (saved for
     * next time), else the last download, else the copy bundled with the app. Never throws.
     */
    suspend fun load(context: Context): RelatedAppsCatalog = withContext(Dispatchers.IO) {
        val app = context.applicationContext
        val cache = File(app.filesDir, CACHE_FILE)
        val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val fresh = cache.exists() && System.currentTimeMillis() - prefs.getLong(KEY_FETCHED_AT, 0L) < DAY_MS
        if (!fresh) {
            runCatching {
                val text = download(LIST_URL).toString(Charsets.UTF_8)
                parse(text) // only keep a copy that parses
                cache.writeText(text)
                prefs.edit().putLong(KEY_FETCHED_AT, System.currentTimeMillis()).apply()
            }.onFailure {
                // Try again after an hour rather than on every screen visit.
                prefs.edit().putLong(KEY_FETCHED_AT, System.currentTimeMillis() - DAY_MS + 60 * 60 * 1000L).apply()
            }
        }
        runCatching { parse(cache.readText()) }.getOrNull()
            ?: runCatching { parse(app.assets.open(ASSET).bufferedReader().use { it.readText() }) }.getOrNull()
            ?: RelatedAppsCatalog(emptyMap(), emptyMap())
    }

    /** The app's icon, downloaded once and kept in the cache folder; null if it can't be had. */
    suspend fun loadIcon(context: Context, app: RelatedApp): Bitmap? = withContext(Dispatchers.IO) {
        val url = app.iconUrl ?: return@withContext null
        val dir = File(context.applicationContext.cacheDir, "related-icons").apply { mkdirs() }
        val file = File(dir, app.id + ".png")
        runCatching {
            if (!file.exists()) file.writeBytes(download(url))
            BitmapFactory.decodeFile(file.path)
        }.getOrNull()
    }

    fun isInstalled(context: Context, packageName: String?): Boolean =
        packageName != null && context.packageManager.getLaunchIntentForPackage(packageName) != null

    /** Opens the app if installed, else its Play page (the Play app, falling back to the website), else its web version. */
    fun open(context: Context, app: RelatedApp) {
        val target = targetFor(app, isInstalled(context, app.packageName))
        val intent = when (target) {
            is RelatedTarget.OpenApp -> context.packageManager.getLaunchIntentForPackage(target.packageName)
            is RelatedTarget.Store -> Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=${target.packageName}"))
            is RelatedTarget.Web -> Intent(Intent.ACTION_VIEW, Uri.parse(target.url))
            RelatedTarget.None -> null
        } ?: return
        try {
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: ActivityNotFoundException) {
            if (target is RelatedTarget.Store) {
                runCatching {
                    context.startActivity(
                        Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=${target.packageName}"))
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                    )
                }
            }
        }
    }

    private fun download(url: String): ByteArray {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = TIMEOUT_MS
        conn.readTimeout = TIMEOUT_MS
        try {
            if (conn.responseCode != 200) error("HTTP ${conn.responseCode}")
            return conn.inputStream.use { it.readBytes() }
        } finally {
            conn.disconnect()
        }
    }
}
