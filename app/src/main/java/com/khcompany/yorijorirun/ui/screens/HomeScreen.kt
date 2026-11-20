package com.khcompany.yorijorirun.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.BiasAlignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.khcompany.yorijorirun.R

/** Dark translucent plate behind small text so it stays legible over the busy scene. */
private val PillBackground = Color(0xFF120B22).copy(alpha = 0.62f)

/**
 * Portrait title screen: the logo sits in the sky, a compact PLAY button sits at the bottom on the
 * near path, and the four riders in between stay in view (same layout as the web build).
 */
@Composable
fun HomeScreen(highScore: Int, onPlay: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Anchored toward the top (the riders sit ~50-85% down, so they survive the crop even on
        // 16:9 screens) to keep the skyline behind the logo.
        Image(
            painter = painterResource(R.drawable.home_portrait),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
            alignment = BiasAlignment(horizontalBias = 0f, verticalBias = -0.6f),
        )
        // Darkens the sky behind the logo and the road behind the button; the middle of the
        // scene stays bright.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0f to Color.Black.copy(alpha = 0.55f),
                        0.32f to Color.Black.copy(alpha = 0.10f),
                        0.55f to Color.Black.copy(alpha = 0.15f),
                        0.78f to Color.Black.copy(alpha = 0.10f),
                        1f to Color.Black.copy(alpha = 0.25f),
                    ),
                ),
        )
        val textShadow = Shadow(color = Color.Black.copy(alpha = 0.7f), offset = Offset(0f, 4f), blurRadius = 12f)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.weight(0.10f))
            // The designed logo (design/title-icon/logo.html, concept C3); the description keeps the
            // title readable for screen readers.
            Image(
                painter = painterResource(R.drawable.title_logo),
                contentDescription = "요리조리 런",
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                text = "도시 산책로를 달리는 레트로 러너",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier
                    .padding(top = 14.dp)
                    .background(PillBackground, RoundedCornerShape(50))
                    .padding(horizontal = 16.dp, vertical = 6.dp),
            )
            // BEST stays up under the subtitle, so nothing but PLAY covers the riders.
            if (highScore > 0) {
                Text(
                    text = "BEST  $highScore",
                    style = MaterialTheme.typography.titleLarge.copy(shadow = textShadow),
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .background(PillBackground, RoundedCornerShape(16.dp))
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                )
            }
            // The free space goes here, over the riders; a smaller PLAY sits at the bottom, on the
            // near path below their feet.
            Spacer(modifier = Modifier.weight(1f))
            Button(
                onClick = onPlay,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(32.dp),
                modifier = Modifier
                    .fillMaxWidth(0.5f)
                    .height(52.dp),
            ) {
                Text(
                    text = "PLAY",
                    style = MaterialTheme.typography.labelLarge,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            }
            Spacer(modifier = Modifier.height(36.dp))
        }
    }
}
