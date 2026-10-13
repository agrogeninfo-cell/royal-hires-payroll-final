package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.HomeWork
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.BoardingLocation
import com.aistudio.royalhires.model.Employee
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun BoardingScreen(
    boardingLocations: List<BoardingLocation>,
    employees: List<Employee>,
    onSaveBoarding: (BoardingLocation) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var editingBoarding by remember { mutableStateOf<BoardingLocation?>(null) }

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
                        text = "Agency Quarters & Boarding",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Helper residential facilities & daily deduction rates",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = {
                        editingBoarding = null
                        showDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Hostel", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(boardingLocations) { location ->
            val residentCount = employees.count { it.boardingLocationId == location.id }

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
                    .clickable {
                        editingBoarding = location
                        showDialog = true
                    }
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
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
                                    imageVector = Icons.Default.HomeWork,
                                    contentDescription = location.name,
                                    tint = ForestPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = location.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = location.address,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        StatusBadge(
                            text = "LKR ${location.dailyRate.toInt()}/day",
                            textColor = ForestPrimary,
                            backgroundColor = MintSurface
                        )
                    }

                    HorizontalDivider(color = BorderSubtle)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "$residentCount Allocated Residents",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = EmeraldAccent
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = "Phone", tint = TextSecondary, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = location.contactPhone,
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
        AddEditBoardingDialog(
            location = editingBoarding,
            onDismiss = { showDialog = false },
            onSave = { updated ->
                onSaveBoarding(updated)
                showDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditBoardingDialog(
    location: BoardingLocation?,
    onDismiss: () -> Unit,
    onSave: (BoardingLocation) -> Unit
) {
    var name by remember { mutableStateOf(location?.name ?: "") }
    var address by remember { mutableStateOf(location?.address ?: "") }
    var phone by remember { mutableStateOf(location?.contactPhone ?: "") }
    var rateText by remember { mutableStateOf(location?.dailyRate?.toString() ?: "350.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (location == null) "Add Hostel / Quarters" else "Edit Quarters", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Quarters Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Caretaker Phone") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = rateText,
                    onValueChange = { rateText = it },
                    label = { Text("Daily Rent Rate (LKR)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val updated = BoardingLocation(
                        id = location?.id ?: "board-${System.currentTimeMillis()}",
                        name = name.ifEmpty { "Agency Quarters" },
                        address = address,
                        contactPhone = phone,
                        dailyRate = rateText.toDoubleOrNull() ?: 350.0
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
