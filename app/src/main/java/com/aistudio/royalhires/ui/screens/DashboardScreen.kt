package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.*
import com.aistudio.royalhires.ui.components.MetricCard
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    factories: List<Factory>,
    employees: List<Employee>,
    attendance: List<AttendanceRecord>,
    payrollRuns: List<PayrollRun>,
    invoices: List<FactoryInvoice>,
    receipts: List<FactoryReceipt>,
    onNavigate: (Screen) -> Unit,
    onQuickAction: () -> Unit
) {
    val activeHelpersCount = employees.count { it.status == "active" }
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    val todayAttendance = attendance.filter { it.date == today }
    val presentCount = todayAttendance.count { it.status == AttendanceStatus.PRESENT }
    val halfDayCount = todayAttendance.count { it.status == AttendanceStatus.HALF_DAY }
    val absentCount = todayAttendance.count { it.status == AttendanceStatus.ABSENT }
    val pendingOtRecords = attendance.filter { it.submissionStatus == SubmissionStatus.SUBMITTED && it.otHours > 0 }
    val pendingOtHours = pendingOtRecords.sumOf { it.otHours }
    val totalRevenue = invoices.sumOf { it.totalAmount }
    val totalOutstanding = invoices.sumOf { it.outstandingBalance }

    val attendancePct = if (todayAttendance.isNotEmpty()) {
        ((presentCount + (halfDayCount * 0.5)) / todayAttendance.size * 100).toInt()
    } else {
        92
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Hero Banner
        item {
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = ForestPrimary),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                modifier = Modifier.fillMaxWidth().testTag("hero_banner")
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color.White.copy(alpha = 0.15f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .background(Color(0xFF34D399), CircleShape)
                                )
                                Text(
                                    text = "ROYAL HIRES OPERATIONS",
                                    color = MintSurface,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Text(
                            text = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(Date()),
                            color = MintSurface.copy(alpha = 0.9f),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Text(
                        text = "Industrial Factory Manpower\nManagement & Payroll",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        lineHeight = 26.sp
                    )

                    Text(
                        text = "Kelaniya, Biyagama EPZ & Katunayake FTZ industrial helper deployment active.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MintSurface.copy(alpha = 0.85f)
                    )

                    Button(
                        onClick = onQuickAction,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = ForestPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.padding(top = 4.dp).testTag("quick_action_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = "Quick Actions",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Quick Dispatch & Action",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // 4 KPI Cards Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        title = "Active Helpers",
                        value = "$activeHelpersCount",
                        subtitle = "100% Factory Assigned",
                        icon = Icons.Default.People,
                        iconColor = EmeraldAccent,
                        iconBgColor = MintSurface,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigate(Screen.EMPLOYEES) }
                    )
                    MetricCard(
                        title = "Today's Attendance",
                        value = "$attendancePct%",
                        subtitle = "$presentCount Present • $absentCount Absent",
                        icon = Icons.Default.CheckCircle,
                        iconColor = BlueInfo,
                        iconBgColor = BlueBg,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigate(Screen.ATTENDANCE) }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        title = "Pending OT",
                        value = "${pendingOtHours} hrs",
                        subtitle = "${pendingOtRecords.size} Requests Pending",
                        icon = Icons.Default.AccessTime,
                        iconColor = GoldWarning,
                        iconBgColor = GoldBg,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigate(Screen.OVERTIME) }
                    )
                    MetricCard(
                        title = "Total Billed",
                        value = "LKR ${(totalRevenue / 1000).toInt()}k",
                        subtitle = "Outstanding: LKR ${(totalOutstanding / 1000).toInt()}k",
                        icon = Icons.Default.Receipt,
                        iconColor = PurpleAccent,
                        iconBgColor = PurpleBg,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigate(Screen.INVOICES) }
                    )
                }
            }
        }

        // Attendance Summary Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(18.dp))
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
                        Column {
                            Text(
                                text = "Daily Helper Attendance Status",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Recorded helper shifts for $today",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                        TextButton(onClick = { onNavigate(Screen.ATTENDANCE) }) {
                            Text("View All", color = EmeraldAccent, fontWeight = FontWeight.Bold)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        AttendanceStatPill("Present", presentCount, Color(0xFF109768), MintSurface)
                        AttendanceStatPill("Half Day", halfDayCount, Color(0xFF2563EB), BlueBg)
                        AttendanceStatPill("Absent", absentCount, Color(0xFFDC2626), RedBg)
                        AttendanceStatPill("OT Pending", pendingOtRecords.size, Color(0xFFD97706), GoldBg)
                    }
                }
            }
        }

        // Quick Module Shortcuts
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Agency Operations Modules",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                val modules = listOf(
                    Triple(Screen.FACTORIES, Icons.Default.Factory, "Factories"),
                    Triple(Screen.EMPLOYEES, Icons.Default.Group, "Employees"),
                    Triple(Screen.BOARDING, Icons.Default.HomeWork, "Boarding"),
                    Triple(Screen.PAYROLL, Icons.Default.AccountBalanceWallet, "Payroll"),
                    Triple(Screen.INVOICES, Icons.Default.Description, "Invoices"),
                    Triple(Screen.RECEIPTS, Icons.Default.PriceCheck, "Receipts"),
                    Triple(Screen.REPORTS, Icons.Default.BarChart, "Analytics"),
                    Triple(Screen.AUDIT, Icons.Default.History, "Audit Logs"),
                    Triple(Screen.PROFILE, Icons.Default.Badge, "Agency Info")
                )

                for (i in modules.indices step 3) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (j in 0..2) {
                            if (i + j < modules.size) {
                                val (screen, icon, label) = modules[i + j]
                                Card(
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                                        .clickable { onNavigate(screen) }
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(34.dp)
                                                .background(MintSurface, RoundedCornerShape(10.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = icon,
                                                contentDescription = label,
                                                tint = ForestPrimary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        Text(
                                            text = label,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Active Factories Snapshot
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Active Client Factories",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    TextButton(onClick = { onNavigate(Screen.FACTORIES) }) {
                        Text("Manage", color = EmeraldAccent, fontWeight = FontWeight.Bold)
                    }
                }

                factories.forEach { factory ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                            .clickable { onNavigate(Screen.FACTORIES) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .background(MintSurface, RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Apartment,
                                        contentDescription = factory.name,
                                        tint = ForestPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = factory.name,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = factory.address,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                StatusBadge(
                                    text = if (factory.billingMethod == BillingRateMethod.SAME_RATE_FOR_ALL)
                                        "LKR ${factory.sameRate.toInt()}/day"
                                    else
                                        "M: ${factory.maleRate.toInt()} / F: ${factory.femaleRate.toInt()}",
                                    textColor = ForestPrimary,
                                    backgroundColor = MintSurface
                                )
                                Text(
                                    text = "OT: LKR ${factory.factoryOvertimeRateHourly.toInt()}/hr",
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // Managing Director Footer Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(MintSurface, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "TS",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = ForestPrimary
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "ROYAL HIRES (PVT) LTD",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = EmeraldAccent,
                            letterSpacing = 0.8.sp
                        )
                        Text(
                            text = "Thusith Samarasinghe",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Managing Director • Sri Lanka Manpower License",
                            fontSize = 10.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AttendanceStatPill(
    label: String,
    count: Int,
    textColor: Color,
    bgColor: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = bgColor
        ) {
            Text(
                text = "$count",
                color = textColor,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }
        Text(
            text = label,
            fontSize = 10.sp,
            color = TextSecondary,
            fontWeight = FontWeight.Medium
        )
    }
}
