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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.Screen
import com.aistudio.royalhires.ui.theme.*

@Composable
fun QuickActionDialog(
    onDismiss: () -> Unit,
    onNavigate: (Screen) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(MintSurface, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Bolt, contentDescription = "Quick Actions", tint = ForestPrimary, modifier = Modifier.size(20.dp))
                }
                Text("Agency Quick Actions", fontWeight = FontWeight.Bold, color = TextPrimary)
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickActionItem(
                    title = "Mark Helper Attendance",
                    subtitle = "Log shifts, meals & quarters usage",
                    icon = Icons.Default.CheckCircle,
                    onClick = {
                        onNavigate(Screen.ATTENDANCE)
                        onDismiss()
                    }
                )
                QuickActionItem(
                    title = "Approve Overtime (OT)",
                    subtitle = "Sign off supervisor OT submissions",
                    icon = Icons.Default.AccessTime,
                    onClick = {
                        onNavigate(Screen.OVERTIME)
                        onDismiss()
                    }
                )
                QuickActionItem(
                    title = "Run Helper Payroll",
                    subtitle = "Generate weekly/monthly wage slips",
                    icon = Icons.Default.Payments,
                    onClick = {
                        onNavigate(Screen.PAYROLL)
                        onDismiss()
                    }
                )
                QuickActionItem(
                    title = "Generate Client Invoice",
                    subtitle = "Bill client factories with rate lock",
                    icon = Icons.Default.Receipt,
                    onClick = {
                        onNavigate(Screen.INVOICES)
                        onDismiss()
                    }
                )
                QuickActionItem(
                    title = "Record Payment Receipt",
                    subtitle = "Log factory bank transfers & cheques",
                    icon = Icons.Default.PriceCheck,
                    onClick = {
                        onNavigate(Screen.RECEIPTS)
                        onDismiss()
                    }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = TextSecondary)
            }
        }
    )
}

@Composable
fun QuickActionItem(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CanvasBgLight),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(MintSurface, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = ForestPrimary, modifier = Modifier.size(20.dp))
            }
            Column {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextPrimary)
                Text(text = subtitle, fontSize = 10.sp, color = TextSecondary)
            }
        }
    }
}
