package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.AuditLog
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun AuditScreen(auditLogs: List<AuditLog>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column {
                Text(
                    text = "System Audit Trail",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Immutable event log of operational changes, OT approvals, and billing records",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        }

        items(auditLogs) { log ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusBadge(
                            text = log.action,
                            textColor = ForestPrimary,
                            backgroundColor = MintSurface
                        )
                        Text(
                            text = log.timestamp,
                            fontSize = 10.sp,
                            color = TextSecondary
                        )
                    }

                    Text(
                        text = log.details,
                        fontSize = 12.sp,
                        color = TextPrimary,
                        fontWeight = FontWeight.Medium
                    )

                    Text(
                        text = "Actor: ${log.actor} (${log.role})",
                        fontSize = 10.sp,
                        color = TextSecondary
                    )
                }
            }
        }
    }
}
