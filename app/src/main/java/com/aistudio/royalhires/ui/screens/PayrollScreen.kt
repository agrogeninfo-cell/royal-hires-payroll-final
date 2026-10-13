package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.PayrollRun
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun PayrollScreen(
    payrollRuns: List<PayrollRun>,
    onGeneratePayroll: (String, String) -> Unit
) {
    var showGenerateDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Helper Payroll & Pay Slips",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Wage calculation, approved OT, meals & boarding deductions",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = { showGenerateDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("generate_payroll_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Run", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Run Payroll", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(payrollRuns) { run ->
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
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(MintSurface, RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Payments,
                                    contentDescription = run.payrollNumber,
                                    tint = ForestPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = run.payrollNumber,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Period: ${run.periodStart} to ${run.periodEnd}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        StatusBadge(
                            text = "LKR ${run.totalNet.toInt()} Net",
                            textColor = EmeraldAccent,
                            backgroundColor = MintSurface
                        )
                    }

                    // Financial summary row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CanvasBgLight, RoundedCornerShape(10.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Total Gross", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${run.totalGross.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = TextPrimary
                            )
                        }
                        Column {
                            Text(text = "Deductions", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${run.totalDeductions.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = RedDanger
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Net Disbursed", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${run.totalNet.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = ForestPrimary
                            )
                        }
                    }

                    // Pay slip items preview
                    Text(
                        text = "Helper Breakdown (${run.items.size} Workers):",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    run.items.take(4).forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = item.employeeName,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "${item.daysWorked} days • ${item.approvedOtHours}h OT • Ded: LKR ${(item.mealDeductions + item.boardingDeductions).toInt()}",
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                            Text(
                                text = "LKR ${item.netPayable.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = ForestPrimary
                            )
                        }
                    }
                }
            }
        }
    }

    if (showGenerateDialog) {
        GeneratePayrollDialog(
            onDismiss = { showGenerateDialog = false },
            onGenerate = { start, end ->
                onGeneratePayroll(start, end)
                showGenerateDialog = false
            }
        )
    }
}

@Composable
fun GeneratePayrollDialog(
    onDismiss: () -> Unit,
    onGenerate: (String, String) -> Unit
) {
    var startDate by remember { mutableStateOf("2026-10-08") }
    var endDate by remember { mutableStateOf("2026-10-14") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Generate Helper Payroll Run", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Automatically aggregates daily attendance, adds approved overtime wages, and computes meal & quarters deductions for the given period.",
                    fontSize = 11.sp,
                    color = TextSecondary
                )
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Period Start (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("Period End (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onGenerate(startDate, endDate) },
                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
            ) {
                Text("Generate Payroll")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
