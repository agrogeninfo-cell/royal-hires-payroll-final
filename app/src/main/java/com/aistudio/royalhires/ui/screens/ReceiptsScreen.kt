package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PriceCheck
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
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ReceiptsScreen(
    receipts: List<FactoryReceipt>,
    factories: List<Factory>,
    invoices: List<FactoryInvoice>,
    onRecordReceipt: (FactoryReceipt) -> Unit
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
                        text = "Factory Payment Receipts",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Bank transfers, cheques, and invoice collections",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Button(
                    onClick = { showDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("record_receipt_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Record", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Record Receipt", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(receipts) { receipt ->
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
                                    imageVector = Icons.Default.PriceCheck,
                                    contentDescription = receipt.receiptNumber,
                                    tint = ForestPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = receipt.receiptNumber,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "${receipt.factoryName} • Date: ${receipt.receiptDate}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        StatusBadge(
                            text = "LKR ${receipt.amount.toInt()}",
                            textColor = EmeraldAccent,
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
                            text = "Mode: ${receipt.paymentMethod} (Ref: ${receipt.referenceNumber})",
                            fontSize = 11.sp,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold
                        )

                        Text(
                            text = if (receipt.allocations.isNotEmpty())
                                "Allocated to ${receipt.allocations.first().invoiceNumber}"
                            else "Unallocated",
                            fontSize = 10.sp,
                            color = ForestPrimary
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        RecordReceiptDialog(
            factories = factories,
            invoices = invoices,
            onDismiss = { showDialog = false },
            onSave = { r ->
                onRecordReceipt(r)
                showDialog = false
            }
        )
    }
}

@Composable
fun RecordReceiptDialog(
    factories: List<Factory>,
    invoices: List<FactoryInvoice>,
    onDismiss: () -> Unit,
    onSave: (FactoryReceipt) -> Unit
) {
    var selectedFactory by remember { mutableStateOf(factories.firstOrNull()) }
    var amountText by remember { mutableStateOf("50000.0") }
    var paymentMethod by remember { mutableStateOf("Bank Transfer") }
    var refNumber by remember { mutableStateOf("BOC-TX-") }

    val unpaidInvoices = invoices.filter {
        selectedFactory != null && it.factoryId == selectedFactory?.id && it.outstandingBalance > 0
    }
    var selectedInvoice by remember { mutableStateOf(unpaidInvoices.firstOrNull()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Record Factory Payment Receipt", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Client Factory: ${selectedFactory?.name ?: "None"}", fontWeight = FontWeight.SemiBold, color = ForestPrimary)

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Payment Amount (LKR)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = refNumber,
                    onValueChange = { refNumber = it },
                    label = { Text("Bank Reference / Cheque No.") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Payment Method:", style = MaterialTheme.typography.labelMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf("Bank Transfer", "Cheque", "Cash").forEach { method ->
                        FilterChip(
                            selected = paymentMethod == method,
                            onClick = { paymentMethod = method },
                            label = { Text(method, fontSize = 9.sp) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                if (unpaidInvoices.isNotEmpty()) {
                    Text("Apply to Outstanding Invoice:", style = MaterialTheme.typography.labelMedium)
                    unpaidInvoices.take(2).forEach { inv ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedInvoice?.id == inv.id,
                                onClick = { selectedInvoice = inv }
                            )
                            Text("${inv.invoiceNumber} (Bal: LKR ${inv.outstandingBalance.toInt()})", fontSize = 11.sp)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val fac = selectedFactory ?: return@Button
                    val amt = amountText.toDoubleOrNull() ?: 0.0
                    val inv = selectedInvoice
                    val allocs = if (inv != null) {
                        listOf(ReceiptAllocation("ra-${System.currentTimeMillis()}", inv.id, inv.invoiceNumber, amt.coerceAtMost(inv.outstandingBalance)))
                    } else emptyList()

                    val now = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                    val newReceipt = FactoryReceipt(
                        id = "RCT-${System.currentTimeMillis()}",
                        receiptNumber = "RCT-2026-${(100..999).random()}",
                        factoryId = fac.id,
                        factoryName = fac.name,
                        receiptDate = now,
                        amount = amt,
                        paymentMethod = paymentMethod,
                        referenceNumber = refNumber,
                        unallocatedAmount = (amt - allocs.sumOf { it.amountAllocated }).coerceAtLeast(0.0),
                        allocations = allocs
                    )
                    onSave(newReceipt)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ForestPrimary)
            ) {
                Text("Confirm Receipt")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
