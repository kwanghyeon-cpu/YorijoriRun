package com.khcompany.yorijorirun.ui.screens

import com.khcompany.yorijorirun.game.highway.TrafficKind
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.pow
import kotlin.math.sin

/**
 * Procedural "alive" motion for the rear-view sprites, so riders bob and sway instead of sliding
 * like paper cut-outs. Drawing only: the engine, hitboxes and lanes are untouched.
 * Mirrors riderPose() in the web build's highway-render.js — change both together.
 */
internal enum class MotionStyle { RUN, BIKE, KICK, SKATE, MOTOR, NONE }

/**
 * [lift] raises the sprite by this fraction of its height; [scaleX]/[scaleY] squash it about its
 * bottom center; [tiltDegrees] rocks it about the same point. [frame] picks the sprite: 0 is the
 * main one, 1 the second animation frame ("<name>_b") when the rider has one.
 */
internal data class RiderPose(
    val lift: Float,
    val scaleX: Float,
    val scaleY: Float,
    val tiltDegrees: Float,
    val frame: Int = 0,
) {
    companion object {
        val STILL = RiderPose(0f, 1f, 1f, 0f)
    }
}

internal fun motionStyleForRide(rideId: String): MotionStyle = when (rideId) {
    "jogging" -> MotionStyle.RUN
    "bicycle" -> MotionStyle.BIKE
    "kickboard" -> MotionStyle.KICK
    "inline" -> MotionStyle.SKATE
    else -> MotionStyle.NONE
}

internal fun motionStyleFor(kind: TrafficKind): MotionStyle = when (kind) {
    TrafficKind.SEDAN -> MotionStyle.BIKE // cyclist
    TrafficKind.SUV, TrafficKind.BUS -> MotionStyle.RUN // dog walker, running crew
    TrafficKind.TRUCK -> MotionStyle.MOTOR // delivery scooter
    TrafficKind.CONE, TrafficKind.BARRIER -> MotionStyle.NONE
}

/**
 * The pose at [seconds] of game time. [cadence] scales the rhythm (1 = cruising; faster when the
 * runner goes faster); [phase] (0..1) offsets one character from another so a crowd doesn't move
 * in lockstep.
 */
internal fun riderPose(style: MotionStyle, seconds: Float, cadence: Float, phase: Float): RiderPose {
    val tau = 2f * PI.toFloat()
    return when (style) {
        MotionStyle.RUN -> {
            // One bounce per step; the body sways toward the planted foot, so the tilt flips sign
            // every step (sin over half a turn per step). Landing squashes a little.
            val steps = seconds * 2.7f * cadence + phase * 2f
            val air = abs(sin(PI.toFloat() * steps))
            val land = (1f - air).pow(3)
            RiderPose(
                lift = 0.05f * air,
                scaleX = 1f + 0.04f * land,
                scaleY = 1f - 0.06f * land,
                tiltDegrees = 3.2f * sin(PI.toFloat() * steps),
                // The legs swap at each landing, in step with the bounce.
                frame = floor(steps).toInt() and 1,
            )
        }
        MotionStyle.BIKE -> {
            // Pedalling: the rider rocks side to side once per crank turn, with a tiny bob.
            val turns = seconds * 1.4f * cadence + phase
            val crank = tau * turns
            RiderPose(
                lift = 0.01f * abs(sin(crank)),
                scaleX = 1f,
                scaleY = 1f,
                tiltDegrees = 3.5f * sin(crank),
                // The other pedal comes down every half turn.
                frame = floor(turns * 2f).toInt() and 1,
            )
        }
        MotionStyle.KICK -> {
            // Glide, then a quick push off every cycle: a small hop and a lean, then settle.
            val cycle = seconds * 0.8f * cadence + phase
            val u = cycle - floor(cycle)
            val push = if (u < 0.25f) sin(PI.toFloat() * u / 0.25f) else 0f
            RiderPose(
                lift = 0.035f * push,
                scaleX = 1f,
                scaleY = 1f + 0.02f * push,
                tiltDegrees = -2.2f * push + 0.8f * sin(tau * cycle),
                // The pushing foot is down only during the push.
                frame = if (push > 0f) 1 else 0,
            )
        }
        MotionStyle.SKATE -> {
            // Inline skating: long alternating pushes. The skater leans well over the gliding leg
            // (the lean flips every stride), rises a touch mid-glide, and the legs swap each stride.
            val strides = seconds * 1.3f * cadence + phase * 2f
            val glide = abs(sin(PI.toFloat() * strides))
            RiderPose(
                lift = 0.012f * glide,
                scaleX = 1f,
                scaleY = 1f,
                tiltDegrees = 5f * sin(PI.toFloat() * strides),
                frame = floor(strides).toInt() and 1,
            )
        }
        MotionStyle.MOTOR -> {
            // A running motor: a fast fine buzz and a slow gentle sway.
            val t = seconds + phase * 10f
            RiderPose(
                lift = 0.006f * (0.5f + 0.5f * sin(tau * 13f * t)),
                scaleX = 1f,
                scaleY = 1f,
                tiltDegrees = 1.2f * sin(tau * 1.1f * cadence * t),
            )
        }
        MotionStyle.NONE -> RiderPose.STILL
    }
}

/** A stable 0..1 offset per obstacle, so neighbours don't bob in step. */
internal fun motionPhase(id: Long): Float {
    val x = id * 0.6180339f
    return x - floor(x)
}

/** Rhythm for a moving obstacle from its own speed (world units per second, about 6..13). */
internal fun trafficCadence(speed: Float): Float = (0.8f + 0.4f * (speed - 6f) / 7f).coerceIn(0.7f, 1.25f)

/** Rhythm for the player's ride from the run speed (0..1 of the top speed). */
internal fun playerCadence(speedRatio: Float): Float = 0.85f + 0.4f * speedRatio.coerceIn(0f, 1f)
