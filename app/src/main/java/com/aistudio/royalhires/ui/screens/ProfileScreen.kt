package com.aistudio.royalhires.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.royalhires.model.User
import com.aistudio.royalhires.ui.components.StatusBadge
import com.aistudio.royalhires.ui.theme.*

@Composable
fun ProfileScreen(
    currentUser: User,
    allUsers: List<User>,
    onSelectUser: (User) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBgLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Company Identity Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = ForestPrimary),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .background(Color.White, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "RH",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = ForestPrimary
                            )
                        }

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "ROYAL HIRES (PVT) LTD",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                                Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Color(0xFF34D399), modifier = Modifier.size(16.dp))
                            }
                            Text(
                                text = "Industrial Manpower Operations & Payroll",
                                style = MaterialTheme.typography.bodySmall,
                                color = MintSurface.copy(alpha = 0.9f)
                            )
                        }
                    }

                    HorizontalDivider(color = Color.White.copy(alpha = 0.2f))

                    Text(
                        text = "Managing Director: Thusith Samarasinghe\nAddress: Industrial Hub, Colombo / Kelaniya\nAgency License: SL-MPR-2024-8891\nContact: +94 11 291 0000 / info@royalhires.lk",
                        style = MaterialTheme.typography.bodySmall,
                        color = MintSurface,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // Active Session Card
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
                        text = "Current Signed-In Staff Profile",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = currentUser.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = currentUser.email,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }

                        StatusBadge(
                            text = currentUser.role.label,
                            textColor = ForestPrimary,
                            backgroundColor = MintSurface
                        )
                    }
                }
            }
        }

        // Switch Staff Role
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
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Switch Staff Persona / Role",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    allUsers.forEach { user ->
                        val isSelected = user.id == currentUser.id
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) MintSurface else CanvasBgLight
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(
                                    1.dp,
                                    if (isSelected) EmeraldAccent else BorderSubtle,
                                    RoundedCornerShape(10.dp)
                                )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = user.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = user.role.label,
                                        fontSize = 10.sp,
                                        color = TextSecondary
                                    )
                                }

                                if (isSelected) {
                                    Text("Active", color = EmeraldAccent, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                } else {
                                    TextButton(onClick = { onSelectUser(user) }) {
                                        Text("Select", color = ForestPrimary, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
