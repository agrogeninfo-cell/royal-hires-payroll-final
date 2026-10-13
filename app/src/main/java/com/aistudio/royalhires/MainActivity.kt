package com.aistudio.royalhires

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.aistudio.royalhires.ui.theme.RoyalHiresTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RoyalHiresTheme {
                RoyalHiresApp()
            }
        }
    }
}
