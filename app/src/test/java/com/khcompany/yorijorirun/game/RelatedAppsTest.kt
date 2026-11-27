package com.khcompany.yorijorirun.game

import org.junit.Assert.assertEquals
import org.junit.Test

class RelatedAppsTest {
    private fun app(id: String, pkg: String? = "com.khcompany.$id", public: Boolean = false, web: String? = null) =
        RelatedApp(id = id, name = id, tagline = "", packageName = pkg, public = public, web = web, iconUrl = null)

    private val catalog = RelatedAppsCatalog(
        groups = linkedMapOf(
            "racing" to listOf("lanedash", "yorijorirun"),
            "other" to listOf("yorijorirun", "secret", "webonly", "lanedash"),
            "unrelated" to listOf("sutra"),
        ),
        apps = listOf(
            app("lanedash", public = true, web = "https://example.test/lanedash"),
            app("yorijorirun", public = false, web = "https://example.test/yorijori"),
            app("secret", public = false, web = null), // nowhere to send people: left out
            app("webonly", pkg = null, public = false, web = "https://example.test/web"),
            app("sutra", public = false, web = "https://example.test/sutra"),
        ).associateBy { it.id },
    )

    @Test
    fun siblingsAreTheOtherAppsInMyGroups_withoutRepeatsOrDeadEnds() {
        assertEquals(listOf("lanedash", "webonly"), RelatedApps.siblings(catalog, "yorijorirun").map { it.id })
    }

    @Test
    fun anAppInNoGroupHasNoSiblings() {
        assertEquals(emptyList<RelatedApp>(), RelatedApps.siblings(catalog, "nobody"))
    }

    @Test
    fun aTapOpensTheInstalledApp_elseItsStorePage_elseItsWebVersion() {
        val laneDash = catalog.apps.getValue("lanedash")
        assertEquals(RelatedTarget.OpenApp("com.khcompany.lanedash"), RelatedApps.targetFor(laneDash, installed = true))
        assertEquals(RelatedTarget.Store("com.khcompany.lanedash"), RelatedApps.targetFor(laneDash, installed = false))
        val unlisted = catalog.apps.getValue("sutra")
        assertEquals(RelatedTarget.Web("https://example.test/sutra"), RelatedApps.targetFor(unlisted, installed = false))
        assertEquals(RelatedTarget.None, RelatedApps.targetFor(catalog.apps.getValue("secret"), installed = false))
    }
}
