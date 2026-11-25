package com.khcompany.yorijorirun.ui.screens

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import com.khcompany.yorijorirun.game.highway.HW_D0
import com.khcompany.yorijorirun.game.highway.HW_DRAW_DISTANCE
import com.khcompany.yorijorirun.game.highway.RoadStrips
import com.khcompany.yorijorirun.game.highway.roadHalfWidth
import com.khcompany.yorijorirun.game.highway.tForDz
import kotlin.math.floor

// Speed-feel effects for the behind-the-car mode. Everything is cheap on purpose: a few dozen
// rectangles in batched paths and a handful of lines per frame, driven only by engine state.

/** Reused every frame, like the road paths: one batched path per color. */
internal class RoadsideBatch {
    val posts = Path()
    val lamps = Path()
    val bushes = Path()
    fun reset() {
        posts.reset(); lamps.reset(); bushes.reset()
    }
}

private const val ROADSIDE_SPACING = 5f

/** Lateral position (road half-widths) of lamp posts and bushes, just outside the rumble strip. */
private const val LAMP_LATERAL = 1.34f
private const val BUSH_LATERAL = 1.62f

/**
 * Park lamps on one side and bushes on the other, alternating, scrolling past at the road's own
 * pace. Nothing tells you how fast you are going like objects whizzing by at the edge.
 * Call before the road haze so far ones fade into it.
 */
internal fun DrawScope.drawRoadside(
    batch: RoadsideBatch,
    strips: RoadStrips,
    cameraZ: Float,
    horizonY: Float,
    rowHeight: Float,
    postColor: Color,
    lampColor: Color,
    bushColor: Color,
) {
    batch.reset()
    val roadH = size.height - horizonY
    val firstIndex = floor(cameraZ / ROADSIDE_SPACING).toInt() + 1
    val slots = (HW_DRAW_DISTANCE / ROADSIDE_SPACING).toInt() + 1
    for (n in slots downTo 0) { // far to near
        val index = firstIndex + n
        val dz = index * ROADSIDE_SPACING - cameraZ
        if (dz < HW_D0 || dz > HW_DRAW_DISTANCE) continue
        val t = tForDz(dz)
        val y = horizonY + roadH * t
        val hw = roadHalfWidth(t, size.width)
        val cx = strips.centerXAt(y, size.height, rowHeight)
        val lampSide = if (index % 2 == 0) -1f else 1f

        val postW = maxOf(1f, hw * 0.035f)
        // Posts and bushes shrink with distance faster than the (wide) far road does.
        val objScale = 0.35f + 0.65f * t
        // A short park lamp: a post with a round globe on top (no arm reaching over the path).
        val postH = hw * 0.9f * objScale
        val lampX = cx + lampSide * LAMP_LATERAL * hw
        batch.posts.addRect(Rect(lampX - postW / 2f, y - postH, lampX + postW / 2f, y))
        val globeR = maxOf(1f, hw * 0.06f * objScale)
        val globeY = y - postH - globeR * 0.6f
        batch.lamps.addOval(Rect(lampX - globeR, globeY - globeR, lampX + globeR, globeY + globeR))

        val bushR = hw * 0.16f * objScale
        val bushX = cx - lampSide * BUSH_LATERAL * hw
        batch.bushes.addOval(Rect(bushX - bushR * 1.3f, y - bushR * 1.5f, bushX + bushR * 1.3f, y))
    }
    drawPath(batch.bushes, bushColor)
    drawPath(batch.posts, postColor)
    drawPath(batch.lamps, lampColor)
}

