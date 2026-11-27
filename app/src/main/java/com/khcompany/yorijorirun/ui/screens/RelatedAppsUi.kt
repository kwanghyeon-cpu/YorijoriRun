package com.khcompany.yorijorirun.ui.screens

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.khcompany.yorijorirun.game.RelatedApp
import com.khcompany.yorijorirun.game.RelatedApps
import com.khcompany.yorijorirun.ui.components.GameIcon
import com.khcompany.yorijorirun.ui.components.vector

/** The sibling apps for this game, loaded once per screen (the list itself is refreshed at most daily). */
@Composable
fun rememberRelatedApps(): List<RelatedApp> {
    val context = LocalContext.current
    val apps by produceState(initialValue = emptyList<RelatedApp>()) {
        value = RelatedApps.siblings(RelatedApps.load(context))
    }
    return apps
}

/** "함께 쓰면 좋은 앱": one row per sibling app (icon, name, one-line pitch); nothing when there are none. */
@Composable
fun RelatedAppsCard(apps: List<RelatedApp>, modifier: Modifier = Modifier) {
    if (apps.isEmpty()) return
    val context = LocalContext.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "함께 쓰면 좋은 앱",
            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 13.sp),
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
        )
        for (app in apps) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .clickable { RelatedApps.open(context, app) }
                    .padding(vertical = 4.dp),
            ) {
                RelatedAppIcon(app)
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = app.name,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = app.tagline,
                        style = MaterialTheme.typography.bodyLarge.copy(fontSize = 12.sp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Icon(
                    imageVector = GameIcon.OPEN_EXTERNAL.vector,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}

/** A quiet one-line link to the first sibling game, for the game-over panel. */
@Composable
fun RelatedGameLink(apps: List<RelatedApp>, modifier: Modifier = Modifier) {
    val app = apps.firstOrNull() ?: return
    val context = LocalContext.current
    TextButton(onClick = { RelatedApps.open(context, app) }, modifier = modifier) {
        Icon(
            imageVector = GameIcon.FLAG_CHECKERED.vector,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp),
        )
        Text(
            text = "  ${app.name}도 달려 보기",
            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 13.sp),
            color = MaterialTheme.colorScheme.primary,
        )
    }
}

@Composable
private fun RelatedAppIcon(app: RelatedApp) {
    val context = LocalContext.current
    var bitmap by remember(app.id) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(app.id) { bitmap = RelatedApps.loadIcon(context, app) }
    val image = bitmap
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(44.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.background),
    ) {
        if (image != null) {
            Image(bitmap = image.asImageBitmap(), contentDescription = null, modifier = Modifier.size(44.dp))
        } else {
            Icon(
                imageVector = GameIcon.FLAG_CHECKERED.vector,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(22.dp),
            )
        }
    }
}
