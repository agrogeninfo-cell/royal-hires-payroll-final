package com.aistudio.royalhires.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldAccent,
    onPrimary = SurfaceWhite,
    primaryContainer = ForestPrimary,
    onPrimaryContainer = MintSurface,
    secondary = EmeraldLight,
    onSecondary = SurfaceWhite,
    background = DarkBg,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkBorder,
    onSurfaceVariant = DarkTextSecondary
)

private val LightColorScheme = lightColorScheme(
    primary = ForestPrimary,
    onPrimary = SurfaceWhite,
    primaryContainer = MintSurface,
    onPrimaryContainer = ForestDeep,
    secondary = EmeraldAccent,
    onSecondary = SurfaceWhite,
    background = CanvasBgLight,
    onBackground = TextPrimary,
    surface = SurfaceWhite,
    onSurface = TextPrimary,
    surfaceVariant = MintSurface,
    onSurfaceVariant = TextSecondary,
    outline = BorderSubtle
)

@Composable
fun RoyalHiresTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
