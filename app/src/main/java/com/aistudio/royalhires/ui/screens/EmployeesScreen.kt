package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
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
fun EmployeesScreen(
    employees: List<Employee>,
    factories: List<Factory>,
    boardingLocations: List<BoardingLocation>,
    onSaveEmployee: (Employee) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var showDialog by remember { mutableStateOf(false) }
    var editingEmployee by remember { mutableStateOf<Employee?>(null) }

    val filteredEmployees = employees.filter {
        it.fullName.contains(searchQuery, ignoreCase = true) ||
        it.id.contains(searchQuery, ignoreCase = true) ||
        it.nic.contains(searchQuery, ignoreCase = true)
    }

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
                        text = "Helper Workforce Roster",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "${employees.size} active factory helpers registered",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = {
                        editingEmployee = null
                        showDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("add_helper_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Helper", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, ID or NIC...", fontSize = 12.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = TextSecondary) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(12.dp))
            )
        }

        items(filteredEmployees) { employee ->
            val factory = factories.find { it.id == employee.currentFactoryId }
            val boarding = boardingLocations.find { it.id == employee.boardingLocationId }

            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(14.dp))
                    .clickable {
                        editingEmployee = employee
                        showDialog = true
                    }
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
                                .size(42.dp)
                                .background(MintSurface, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = employee.fullName.split(" ").mapNotNull { it.firstOrNull() }.take(2).joinToString(""),
                                fontWeight = FontWeight.ExtraBold,
                                color = ForestPrimary,
                                fontSize = 14.sp
                            )
                        }

                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = employee.fullName,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                StatusBadge(
                                    text = employee.gender.label,
                                    textColor = if (employee.gender == Gender.MALE) BlueInfo else Color(0xFFD946EF),
                                    backgroundColor = if (employee.gender == Gender.MALE) BlueBg else Color(0xFFFDF4FF)
                                )
                            }
                            Text(
                                text = "${employee.id} • NIC: ${employee.nic}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                            Text(
                                text = "Factory: ${factory?.name ?: "Unassigned"} • Daily Wage: LKR ${employee.wageRate.toInt()}",
                                style = MaterialTheme.typography.bodySmall,
                                color = EmeraldAccent,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        StatusBadge(
                            text = if (employee.status == "active") "Active" else "Inactive",
                            textColor = if (employee.status == "active") EmeraldAccent else RedDanger,
                            backgroundColor = if (employee.status == "active") MintSurface else RedBg
                        )
                        if (boarding != null) {
                            Text(
                                text = boarding.name.take(12) + "..",
                                fontSize = 10.sp,
                                color = TextSecondary
                            )
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        AddEditEmployeeDialog(
            employee = editingEmployee,
            factories = factories,
            boardingLocations = boardingLocations,
            onDismiss = { showDialog = false },
            onSave = { updated ->
                onSaveEmployee(updated)
                showDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditEmployeeDialog(
    employee: Employee?,
    factories: List<Factory>,
    boardingLocations: List<BoardingLocation>,
    onDismiss: () -> Unit,
    onSave: (Employee) -> Unit
) {
    var fullName by remember { mutableStateOf(employee?.fullName ?: "") }
    var nic by remember { mutableStateOf(employee?.nic ?: "") }
    var phone by remember { mutableStateOf(employee?.phone ?: "") }
    var address by remember { mutableStateOf(employee?.address ?: "") }
    var gender by remember { mutableStateOf(employee?.gender ?: Gender.MALE) }
    var currentFactoryId by remember { mutableStateOf(employee?.currentFactoryId ?: factories.firstOrNull()?.id ?: "") }
    var wageRateText by remember { mutableStateOf(employee?.wageRate?.toString() ?: "2200.0") }
    var eligibleForMeals by remember { mutableStateOf(employee?.eligibleForMeals ?: true) }
    var eligibleForBoarding by remember { mutableStateOf(employee?.eligibleForBoarding ?: true) }
    var boardingLocationId by remember { mutableStateOf(employee?.boardingLocationId ?: boardingLocations.firstOrNull()?.id) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (employee == null) "Register New Helper" else "Edit Helper Profile", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = { Text("Full Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nic,
                        onValueChange = { nic = it },
                        label = { Text("NIC Number") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Text("Gender:", style = MaterialTheme.typography.labelMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = gender == Gender.MALE,
                        onClick = { gender = Gender.MALE },
                        label = { Text("Male", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = gender == Gender.FEMALE,
                        onClick = { gender = Gender.FEMALE },
                        label = { Text("Female", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = wageRateText,
                    onValueChange = { wageRateText = it },
                    label = { Text("Daily Wage Rate (LKR)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = eligibleForMeals, onCheckedChange = { eligibleForMeals = it })
                        Text("Meals Deductible", fontSize = 11.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = eligibleForBoarding, onCheckedChange = { eligibleForBoarding = it })
                        Text("Quarters Boarding", fontSize = 11.sp)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val updated = Employee(
                        id = employee?.id ?: "EMP-${100 + (1..900).random()}",
                        fullName = fullName.ifEmpty { "New Helper" },
                        nic = nic.ifEmpty { "199500000000" },
                        phone = phone,
                        address = address,
                        gender = gender,
                        currentFactoryId = currentFactoryId,
                        wageRate = wageRateText.toDoubleOrNull() ?: 2200.0,
                        eligibleForMeals = eligibleForMeals,
                        eligibleForBoarding = eligibleForBoarding,
                        boardingLocationId = if (eligibleForBoarding) boardingLocationId else null
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
