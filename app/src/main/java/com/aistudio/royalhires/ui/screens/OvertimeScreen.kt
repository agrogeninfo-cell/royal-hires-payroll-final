package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.*
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun OvertimeScreen(
    attendance: List<AttendanceRecord>,
    factories: List<Factory>,
    onApprove: (String, Boolean) -> Unit
) {
    val otRecords = attendance.filter { it.otHours > 0 }
    val pendingRecords = otRecords.filter { it.submissionStatus == SubmissionStatus.SUBMITTED }
    val approvedRecords = otRecords.filter { it.submissionStatus == SubmissionStatus.APPROVED }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Summary Header
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Overtime Verification & Approval",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Verified helper overtime hours are locked into payroll pay slips and factory customer billing invoices.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = GoldBg,
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "${pendingRecords.size} Requests",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = GoldWarning,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "Awaiting Admin Sign-off",
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MintSurface,
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "${approvedRecords.size} Approved",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = EmeraldAccent,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "Locked into Invoicing",
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            Text(
                text = "Pending Overtime Queue (${pendingRecords.size})",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        if (pendingRecords.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "All supervisor overtime submissions have been approved!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }
            }
        } else {
            items(pendingRecords) { record ->
                val factory = factories.find { it.id == record.factoryId }
                val workerOtRate = factory?.employeeOvertimeRateHourly ?: 350.0
                val factoryBillingRate = factory?.factoryOvertimeRateHourly ?: 500.0

                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = record.employeeName,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "${record.factoryName} • Date: ${record.date}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }

                            StatusBadge(
                                text = "${record.otHours} Hours",
                                textColor = GoldWarning,
                                backgroundColor = GoldBg
                            )
                        }

                        // Rate Transparency Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CanvasBgLight, RoundedCornerShape(8.dp))
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "Worker Pay Rate", fontSize = 9.sp, color = TextSecondary)
                                Text(
                                    text = "LKR ${workerOtRate.toInt()}/hr (LKR ${(workerOtRate * record.otHours).toInt()})",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "Factory Billing Rate", fontSize = 9.sp, color = TextSecondary)
                                Text(
                                    text = "LKR ${factoryBillingRate.toInt()}/hr (LKR ${(factoryBillingRate * record.otHours).toInt()})",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ForestPrimary
                                )
                            }
                        }

                        // Action Buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onApprove(record.id, false) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = RedDanger)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Reject", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Reject", fontSize = 11.sp)
                            }

                            Button(
                                onClick = { onApprove(record.id, true) },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("approve_ot_btn_${record.id}"),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = "Approve", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Approve", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Approved History
        if (approvedRecords.isNotEmpty()) {
            item {
                Text(
                    text = "Recently Approved Overtime (${approvedRecords.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            items(approvedRecords) { record ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = record.employeeName,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = "${record.factoryName} • ${record.date}",
                                fontSize = 10.sp,
                                color = TextSecondary
                            )
                        }

                        StatusBadge(
                            text = "${record.otHours}h Approved",
                            textColor = EmeraldAccent,
                            backgroundColor = MintSurface
                        )
                    }
                }
            }
        }
    }
}
