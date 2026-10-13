package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.Screen
import com.aistudio.royalhires.ui.theme.*

@Composable
fun ModulesDialog(
    currentScreen: Screen,
    onDismiss: () -> Unit,
    onNavigate: (Screen) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "All Operations Modules",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val screens = listOf(
                    Triple(Screen.DASHBOARD, Icons.Default.Dashboard, "Home Dashboard"),
                    Triple(Screen.ATTENDANCE, Icons.Default.CheckCircle, "Daily Attendance"),
                    Triple(Screen.OVERTIME, Icons.Default.AccessTime, "Overtime Sign-off"),
                    Triple(Screen.FACTORIES, Icons.Default.Apartment, "Factory Agreements"),
                    Triple(Screen.EMPLOYEES, Icons.Default.Group, "Helper Workforce"),
                    Triple(Screen.BOARDING, Icons.Default.HomeWork, "Hostels & Boarding"),
                    Triple(Screen.PAYROLL, Icons.Default.Payments, "Wage Pay Slips"),
                    Triple(Screen.INVOICES, Icons.Default.Receipt, "Factory Invoicing"),
                    Triple(Screen.RECEIPTS, Icons.Default.PriceCheck, "Payment Receipts"),
                    Triple(Screen.REPORTS, Icons.Default.BarChart, "Financial Analytics"),
                    Triple(Screen.AUDIT, Icons.Default.History, "System Audit Trail"),
                    Triple(Screen.PROFILE, Icons.Default.Badge, "Agency Profile")
                )

                for (i in screens.indices step 2) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (j in 0..1) {
                            if (i + j < screens.size) {
                                val (screen, icon, title) = screens[i + j]
                                val isSelected = currentScreen == screen
                                Card(
                                    shape = RoundedCornerShape(10.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isSelected) MintSurface else CanvasBgLight
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .border(
                                            1.dp,
                                            if (isSelected) EmeraldAccent else BorderSubtle,
                                            RoundedCornerShape(10.dp)
                                        )
                                        .clickable {
                                            onNavigate(screen)
                                            onDismiss()
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = icon,
                                            contentDescription = title,
                                            tint = if (isSelected) ForestPrimary else TextSecondary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Text(
                                            text = title,
                                            fontSize = 11.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                            color = if (isSelected) ForestPrimary else TextPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = TextSecondary)
            }
        }
    )
}
