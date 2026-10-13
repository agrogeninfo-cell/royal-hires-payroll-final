package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
fun AttendanceScreen(
    attendance: List<AttendanceRecord>,
    employees: List<Employee>,
    factories: List<Factory>,
    selectedDate: String,
    selectedFactoryFilter: String?,
    onDateSelected: (String) -> Unit,
    onFactorySelected: (String?) -> Unit,
    onSaveAttendance: (AttendanceRecord) -> Unit
) {
    var showRecordDialog by remember { mutableStateOf(false) }
    var editingRecord by remember { mutableStateOf<AttendanceRecord?>(null) }

    val filteredRecords = attendance.filter { att ->
        (selectedFactoryFilter == null || att.factoryId == selectedFactoryFilter)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header Controls
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
                                text = "Helper Shift Attendance",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Date: $selectedDate",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }

                        Button(
                            onClick = {
                                editingRecord = null
                                showRecordDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.testTag("mark_attendance_btn")
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Mark", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Mark Shift", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Factory Filter Chips
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        item {
                            FilterChip(
                                selected = selectedFactoryFilter == null,
                                onClick = { onFactorySelected(null) },
                                label = { Text("All Factories (${filteredRecords.size})", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = ForestPrimary,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                        items(factories) { factory ->
                            val count = attendance.count { it.factoryId == factory.id }
                            FilterChip(
                                selected = selectedFactoryFilter == factory.id,
                                onClick = { onFactorySelected(factory.id) },
                                label = { Text("${factory.name.take(12)}.. ($count)", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = ForestPrimary,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        // Attendance Records List
        items(filteredRecords) { record ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                    .clickable {
                        editingRecord = record
                        showRecordDialog = true
                    }
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
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
                                text = "${record.employeeId} • ${record.factoryName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        StatusBadge(
                            text = record.status.label,
                            textColor = when (record.status) {
                                AttendanceStatus.PRESENT -> Color(0xFF109768)
                                AttendanceStatus.HALF_DAY -> BlueInfo
                                AttendanceStatus.ABSENT -> RedDanger
                                AttendanceStatus.LEAVE -> GoldWarning
                            },
                            backgroundColor = when (record.status) {
                                AttendanceStatus.PRESENT -> MintSurface
                                AttendanceStatus.HALF_DAY -> BlueBg
                                AttendanceStatus.ABSENT -> RedBg
                                AttendanceStatus.LEAVE -> GoldBg
                            }
                        )
                    }

                    HorizontalDivider(color = BorderSubtle)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            if (record.hadBreakfast) MealTag("B")
                            if (record.hadLunch) MealTag("L")
                            if (record.hadDinner) MealTag("D")
                            if (record.hadBoarding) MealTag("Hostel")
                        }

                        if (record.otHours > 0) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (record.submissionStatus == SubmissionStatus.APPROVED) MintSurface else GoldBg
                            ) {
                                Text(
                                    text = "OT: ${record.otHours}h (${record.submissionStatus.label})",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (record.submissionStatus == SubmissionStatus.APPROVED) EmeraldAccent else GoldWarning,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showRecordDialog) {
        MarkAttendanceDialog(
            record = editingRecord,
            employees = employees,
            factories = factories,
            selectedDate = selectedDate,
            onDismiss = { showRecordDialog = false },
            onSave = { updated ->
                onSaveAttendance(updated)
                showRecordDialog = false
            }
        )
    }
}

@Composable
fun MealTag(text: String) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = CanvasBgLight,
        modifier = Modifier.border(0.5.dp, BorderSubtle, RoundedCornerShape(6.dp))
    ) {
        Text(
            text = text,
            fontSize = 9.sp,
            color = TextSecondary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarkAttendanceDialog(
    record: AttendanceRecord?,
    employees: List<Employee>,
    factories: List<Factory>,
    selectedDate: String,
    onDismiss: () -> Unit,
    onSave: (AttendanceRecord) -> Unit
) {
    var selectedEmployee by remember { mutableStateOf(record?.let { r -> employees.find { it.id == r.employeeId } } ?: employees.firstOrNull()) }
    var selectedFactory by remember { mutableStateOf(record?.let { r -> factories.find { it.id == r.factoryId } } ?: factories.firstOrNull()) }
    var status by remember { mutableStateOf(record?.status ?: AttendanceStatus.PRESENT) }
    var otHoursText by remember { mutableStateOf(record?.otHours?.toString() ?: "0.0") }
    var hadBreakfast by remember { mutableStateOf(record?.hadBreakfast ?: false) }
    var hadLunch by remember { mutableStateOf(record?.hadLunch ?: true) }
    var hadDinner by remember { mutableStateOf(record?.hadDinner ?: false) }
    var hadBoarding by remember { mutableStateOf(record?.hadBoarding ?: false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (record == null) "Log Shift Attendance" else "Edit Attendance", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Select Helper:", style = MaterialTheme.typography.labelMedium)
                // Helper selection
                selectedEmployee?.let { emp ->
                    Text(text = "${emp.fullName} (${emp.id})", fontWeight = FontWeight.SemiBold, color = ForestPrimary)
                }

                Text("Status:", style = MaterialTheme.typography.labelMedium)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    AttendanceStatus.entries.forEach { s ->
                        FilterChip(
                            selected = status == s,
                            onClick = { status = s },
                            label = { Text(s.label, fontSize = 9.sp) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                OutlinedTextField(
                    value = otHoursText,
                    onValueChange = { otHoursText = it },
                    label = { Text("Overtime Hours") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Meals & Boarding:", style = MaterialTheme.typography.labelMedium)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = hadBreakfast, onCheckedChange = { hadBreakfast = it })
                        Text("Breakfast", fontSize = 10.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = hadLunch, onCheckedChange = { hadLunch = it })
                        Text("Lunch", fontSize = 10.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = hadDinner, onCheckedChange = { hadDinner = it })
                        Text("Dinner", fontSize = 10.sp)
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = hadBoarding, onCheckedChange = { hadBoarding = it })
                    Text("Hostel Boarding Utilized", fontSize = 11.sp, fontWeight = FontWeight.Medium)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val emp = selectedEmployee ?: return@Button
                    val fac = selectedFactory ?: return@Button
                    val ot = otHoursText.toDoubleOrNull() ?: 0.0
                    val units = when (status) {
                        AttendanceStatus.PRESENT -> 1.0
                        AttendanceStatus.HALF_DAY -> 0.5
                        else -> 0.0
                    }
                    val updated = AttendanceRecord(
                        id = record?.id ?: "att-${System.currentTimeMillis()}",
                        employeeId = emp.id,
                        employeeName = emp.fullName,
                        employeeGender = emp.gender,
                        factoryId = fac.id,
                        factoryName = fac.name,
                        date = record?.date ?: selectedDate,
                        status = status,
                        payableUnits = units,
                        otHours = ot,
                        hadBreakfast = hadBreakfast,
                        hadLunch = hadLunch,
                        hadDinner = hadDinner,
                        hadBoarding = hadBoarding,
                        submissionStatus = if (ot > 0) SubmissionStatus.SUBMITTED else SubmissionStatus.APPROVED
                    )
                    onSave(updated)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
