package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.Factory
import com.aistudio.royalhires.model.FactoryInvoice
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun InvoicesScreen(
    invoices: List<FactoryInvoice>,
    factories: List<Factory>,
    onGenerateInvoice: (String, String, String) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }

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
                        text = "Client Factory Invoices",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Billing based on attendance and agreed daily & OT rates",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = { showDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("generate_invoice_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("New Invoice", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(invoices) { invoice ->
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
                                    imageVector = Icons.Default.Receipt,
                                    contentDescription = invoice.invoiceNumber,
                                    tint = ForestPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = invoice.invoiceNumber,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = invoice.factoryName,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        StatusBadge(
                            text = invoice.status.replace("_", " ").uppercase(),
                            textColor = when (invoice.status) {
                                "paid" -> EmeraldAccent
                                "partially_paid" -> GoldWarning
                                else -> BlueInfo
                            },
                            backgroundColor = when (invoice.status) {
                                "paid" -> MintSurface
                                "partially_paid" -> GoldBg
                                else -> BlueBg
                            }
                        )
                    }

                    // Amounts Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CanvasBgLight, RoundedCornerShape(10.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Total Invoiced", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${invoice.totalAmount.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = TextPrimary
                            )
                        }
                        Column {
                            Text(text = "Paid to Date", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${invoice.amountReceived.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = EmeraldAccent
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Outstanding Balance", fontSize = 9.sp, color = TextSecondary)
                            Text(
                                text = "LKR ${invoice.outstandingBalance.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = if (invoice.outstandingBalance > 0) RedDanger else ForestPrimary
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Period: ${invoice.periodStart} to ${invoice.periodEnd}",
                            fontSize = 10.sp,
                            color = TextSecondary
                        )
                        Text(
                            text = "Due: ${invoice.dueDate}",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        CreateInvoiceDialog(
            factories = factories,
            onDismiss = { showDialog = false },
            onGenerate = { facId, start, end ->
                onGenerateInvoice(facId, start, end)
                showDialog = false
            }
        )
    }
}

@Composable
fun CreateInvoiceDialog(
    factories: List<Factory>,
    onDismiss: () -> Unit,
    onGenerate: (String, String, String) -> Unit
) {
    var selectedFactoryId by remember { mutableStateOf(factories.firstOrNull()?.id ?: "") }
    var startDate by remember { mutableStateOf("2026-10-01") }
    var endDate by remember { mutableStateOf("2026-10-07") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Generate Customer Invoice", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Select Client Factory:", style = MaterialTheme.typography.labelMedium)
                factories.forEach { factory ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedFactoryId = factory.id },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedFactoryId == factory.id,
                            onClick = { selectedFactoryId = factory.id }
                        )
                        Text(text = factory.name, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }
                }

                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Billing Period Start") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("Billing Period End") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onGenerate(selectedFactoryId, startDate, endDate) },
                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
            ) {
                Text("Generate Invoice")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
