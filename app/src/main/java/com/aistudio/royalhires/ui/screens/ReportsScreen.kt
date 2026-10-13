package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.*
import com.aistudio.royalhires.ui.theme.*

@Composable
fun ReportsScreen(
    factories: List<Factory>,
    employees: List<Employee>,
    attendance: List<AttendanceRecord>,
    payrollRuns: List<PayrollRun>,
    invoices: List<FactoryInvoice>,
    receipts: List<FactoryReceipt>
) {
    val totalBilled = invoices.sumOf { it.totalAmount }
    val totalPaidToAgency = receipts.sumOf { it.amount }
    val totalPayrollCost = payrollRuns.sumOf { it.totalGross }
    val grossMargin = totalBilled - totalPayrollCost
    val marginPercentage = if (totalBilled > 0) ((grossMargin / totalBilled) * 100).toInt() else 0

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Agency Operations & Financial Reports",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Workforce billing revenue, helper payroll costs, and gross margins",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        }

        // Profitability Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = ForestPrimary),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "ROYAL HIRES AGENCY GROSS MARGIN",
                        color = MintSurface,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LKR ${grossMargin.toInt()}",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "$marginPercentage% Margin",
                                color = MintSurface,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    HorizontalDivider(color = Color.White.copy(alpha = 0.2f))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Total Invoiced Revenue", color = MintSurface.copy(alpha = 0.8f), fontSize = 10.sp)
                            Text(text = "LKR ${totalBilled.toInt()}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Helper Payroll Cost", color = MintSurface.copy(alpha = 0.8f), fontSize = 10.sp)
                            Text(text = "LKR ${totalPayrollCost.toInt()}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // Factory Deployment Breakdown
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
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Factory Workforce Distribution",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    factories.forEach { factory ->
                        val count = employees.count { it.currentFactoryId == factory.id }
                        val factoryAttendance = attendance.filter { it.factoryId == factory.id }
                        val daysBilled = factoryAttendance.sumOf { it.payableUnits }
                        val otBilled = factoryAttendance.sumOf { it.otHours }

                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = factory.name,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "$count Helpers",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ForestPrimary
                                )
                            }
                            Text(
                                text = "Billed Days: $daysBilled • Approved OT: ${otBilled}h • Billing Method: ${factory.billingMethod.label}",
                                fontSize = 10.sp,
                                color = TextSecondary
                            )
                            HorizontalDivider(color = BorderSubtle, modifier = Modifier.padding(vertical = 4.dp))
                        }
                    }
                }
            }
        }
    }
}
