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
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.Phone
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
fun FactoriesScreen(
    factories: List<Factory>,
    onSaveFactory: (Factory) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var editingFactory by remember { mutableStateOf<Factory?>(null) }

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
                        text = "Factory Clients & Agreements",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Industrial deployment contracts & billing rates",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = {
                        editingFactory = null
                        showDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("add_factory_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Factory", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(factories) { factory ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
                    .clickable {
                        editingFactory = factory
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
                                    imageVector = Icons.Default.Apartment,
                                    contentDescription = factory.name,
                                    tint = ForestPrimary,
                                    modifier = Modifier.size(22.dp)
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
                                    text = "${factory.code} • ${factory.address}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        StatusBadge(
                            text = if (factory.active) "Active Contract" else "Inactive",
                            textColor = if (factory.active) EmeraldAccent else RedDanger,
                            backgroundColor = if (factory.active) MintSurface else RedBg
                        )
                    }

                    HorizontalDivider(color = BorderSubtle)

                    // Billing Rate Structure
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CanvasBgLight, RoundedCornerShape(10.dp))
                            .padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "BILLING STRUCTURE: ${factory.billingMethod.label.uppercase()}",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = ForestPrimary,
                            letterSpacing = 0.5.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            if (factory.billingMethod == BillingRateMethod.SAME_RATE_FOR_ALL) {
                                Text(
                                    text = "Daily Rate (All Helpers): LKR ${factory.sameRate.toInt()}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextPrimary
                                )
                            } else {
                                Text(
                                    text = "Male: LKR ${factory.maleRate.toInt()} / Female: LKR ${factory.femaleRate.toInt()}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextPrimary
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "OT Billing: LKR ${factory.factoryOvertimeRateHourly.toInt()}/hr (Worker Pay: LKR ${factory.employeeOvertimeRateHourly.toInt()}/hr)",
                                fontSize = 10.sp,
                                color = TextSecondary
                            )
                        }
                    }

                    // Meal Rates and Contact
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Meals: B: ${factory.breakfastRate.toInt()} | L: ${factory.lunchRate.toInt()} | D: ${factory.dinnerRate.toInt()}",
                            fontSize = 10.sp,
                            color = TextSecondary
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = "Call", tint = EmeraldAccent, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = factory.contactPhone,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        AddEditFactoryDialog(
            factory = editingFactory,
            onDismiss = { showDialog = false },
            onSave = { updated ->
                onSaveFactory(updated)
                showDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditFactoryDialog(
    factory: Factory?,
    onDismiss: () -> Unit,
    onSave: (Factory) -> Unit
) {
    var name by remember { mutableStateOf(factory?.name ?: "") }
    var code by remember { mutableStateOf(factory?.code ?: "") }
    var address by remember { mutableStateOf(factory?.address ?: "") }
    var contactPerson by remember { mutableStateOf(factory?.contactPerson ?: "") }
    var contactPhone by remember { mutableStateOf(factory?.contactPhone ?: "") }
    var billingMethod by remember { mutableStateOf(factory?.billingMethod ?: BillingRateMethod.SAME_RATE_FOR_ALL) }
    var sameRateText by remember { mutableStateOf(factory?.sameRate?.toString() ?: "3000.0") }
    var maleRateText by remember { mutableStateOf(factory?.maleRate?.toString() ?: "3200.0") }
    var femaleRateText by remember { mutableStateOf(factory?.femaleRate?.toString() ?: "2900.0") }
    var workerOtText by remember { mutableStateOf(factory?.employeeOvertimeRateHourly?.toString() ?: "350.0") }
    var factoryOtText by remember { mutableStateOf(factory?.factoryOvertimeRateHourly?.toString() ?: "500.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (factory == null) "Register New Factory" else "Edit Factory Contract", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Factory Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = code,
                        onValueChange = { code = it },
                        label = { Text("Code (e.g. FAC-04)") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = contactPhone,
                        onValueChange = { contactPhone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Factory Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Billing Rate Policy:", style = MaterialTheme.typography.labelMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = billingMethod == BillingRateMethod.SAME_RATE_FOR_ALL,
                        onClick = { billingMethod = BillingRateMethod.SAME_RATE_FOR_ALL },
                        label = { Text("Same Rate", fontSize = 10.sp) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = billingMethod == BillingRateMethod.SEPARATE_MALE_FEMALE_RATES,
                        onClick = { billingMethod = BillingRateMethod.SEPARATE_MALE_FEMALE_RATES },
                        label = { Text("M/F Separate", fontSize = 10.sp) },
                        modifier = Modifier.weight(1f)
                    )
                }

                if (billingMethod == BillingRateMethod.SAME_RATE_FOR_ALL) {
                    OutlinedTextField(
                        value = sameRateText,
                        onValueChange = { sameRateText = it },
                        label = { Text("Standard Daily Rate (LKR)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = maleRateText,
                            onValueChange = { maleRateText = it },
                            label = { Text("Male Rate") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = femaleRateText,
                            onValueChange = { femaleRateText = it },
                            label = { Text("Female Rate") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = workerOtText,
                        onValueChange = { workerOtText = it },
                        label = { Text("Worker OT/hr") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = factoryOtText,
                        onValueChange = { factoryOtText = it },
                        label = { Text("Billed OT/hr") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val updated = Factory(
                        id = factory?.id ?: "fac-${System.currentTimeMillis()}",
                        code = code.ifEmpty { "FAC-${System.currentTimeMillis() % 1000}" },
                        name = name.ifEmpty { "New Factory" },
                        address = address,
                        contactPerson = contactPerson,
                        contactPhone = contactPhone,
                        billingMethod = billingMethod,
                        sameRate = sameRateText.toDoubleOrNull() ?: 3000.0,
                        maleRate = maleRateText.toDoubleOrNull() ?: 3200.0,
                        femaleRate = femaleRateText.toDoubleOrNull() ?: 2900.0,
                        employeeOvertimeRateHourly = workerOtText.toDoubleOrNull() ?: 350.0,
                        factoryOvertimeRateHourly = factoryOtText.toDoubleOrNull() ?: 500.0
                    )
                    onSave(updated)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
            ) {
                Text("Save Contract")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
