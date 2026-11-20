package com.khcompany.pathdash.game

import androidx.compose.ui.graphics.Color

enum class GameStatus { READY, RUNNING, GAME_OVER }

enum class GameOverReason { COLLISION, FUEL_EMPTY }

/** Gameplay sound cues the engine fires; the UI layer maps these to actual audio playback. */
enum class SfxEvent { COIN, CRASH, FUEL_EMPTY, LANE_CHANGE, FUEL_LOW_WARNING, NEAR_MISS, POWERUP, SHIELD_HIT }

/** What a pickup does: refuel, a timed invincibility shield, or a timed fuel magnet. */
enum class ItemType { FUEL, SHIELD, MAGNET }

data class CityTheme(
    val id: String,
    val displayName: String,
    val englishName: String,
    val skyTop: Color,
    val skyBottom: Color,
    val roadColor: Color,
    val roadLineColor: Color,
    /** Drawable name (no extension) of the tileable skyline backdrop, e.g. "city_seoul". */
    val spriteName: String = "",
    /**
     * Horizon color of the skyline sprite (the sky gradient colors above are only a fallback and
     * do not match the sprites) — tints the road haze. Mirrors `haze` in the web catalog.js.
     */
    val haze: Color = Color(0xFF8E83B5),
)

data class CarOption(
    val id: String,
    val displayName: String,
    val englishName: String,
    val bodyColor: Color,
    val roofColor: Color,
    /** Behind-the-car sprite (drawable name, no extension); empty falls back to a placeholder drawing. */
    val rearSpriteName: String = "",
)

object GameCatalog {

    val cities = listOf(
        CityTheme(
            id = "seoul",
            displayName = "서울",
            englishName = "SEOUL",
            skyTop = Color(0xFF2E1A47),
            skyBottom = Color(0xFFFF8C69),
            roadColor = Color(0xFF7A3B2E),
            roadLineColor = Color(0xFFF2E6D0),
            spriteName = "city_seoul",
            haze = Color(0xFFD39A8E),
        ),
        CityTheme(
            id = "tokyo",
            displayName = "도쿄",
            englishName = "TOKYO",
            skyTop = Color(0xFF05021A),
            skyBottom = Color(0xFF1B0F3D),
            roadColor = Color(0xFF232B45),
            roadLineColor = Color(0xFF8FE3FF),
            spriteName = "city_tokyo",
            haze = Color(0xFFA3B8DA),
        ),
        CityTheme(
            id = "newyork",
            displayName = "뉴욕",
            englishName = "NEW YORK",
            skyTop = Color(0xFFFF9A56),
            skyBottom = Color(0xFFFFD56B),
            roadColor = Color(0xFF55606B),
            roadLineColor = Color(0xFFFFFFFF),
            spriteName = "city_newyork",
            haze = Color(0xFF9DCBE6),
        ),
        CityTheme(
            id = "paris",
            displayName = "파리",
            englishName = "PARIS",
            skyTop = Color(0xFFBFE3FF),
            skyBottom = Color(0xFFF6E7D8),
            roadColor = Color(0xFFA08A68),
            roadLineColor = Color(0xFFFFF8EC),
            spriteName = "city_paris",
            haze = Color(0xFF2B556B),
        ),
    )

    val cars = listOf(
        CarOption(
            id = "jogging",
            displayName = "조깅",
            englishName = "JOGGING",
            bodyColor = Color(0xFFE63946),
            roofColor = Color(0xFF1D1D2C),
            rearSpriteName = "car_rear_1",
        ),
        CarOption(
            id = "bicycle",
            displayName = "자전거",
            englishName = "BICYCLE",
            bodyColor = Color(0xFFFFA23C),
            roofColor = Color(0xFF2B2B2B),
            rearSpriteName = "car_rear_2",
        ),
        CarOption(
            id = "cart",
            displayName = "리어카",
            englishName = "CART",
            bodyColor = Color(0xFF3D8BFF),
            roofColor = Color(0xFF1A2340),
            rearSpriteName = "car_rear_3",
        ),
        CarOption(
            id = "kickboard",
            displayName = "킥보드",
            englishName = "KICKBOARD",
            bodyColor = Color(0xFF4CAF50),
            roofColor = Color(0xFF22331F),
            rearSpriteName = "car_rear_4",
        ),
    )

    fun cityById(id: String?): CityTheme = cities.firstOrNull { it.id == id } ?: cities.first()
    fun carById(id: String?): CarOption = cars.firstOrNull { it.id == id } ?: cars.first()
}
