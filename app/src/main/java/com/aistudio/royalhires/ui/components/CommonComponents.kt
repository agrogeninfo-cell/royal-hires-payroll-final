package com.aistudio.royalhires.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import com.aistudio.royalhires.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoyalHiresTopBar(
    currentScreen: Screen,
    currentUser: User,
    allUsers: List<User>,
    isOnline: Boolean,
    pendingOtCount: Int,
    onUserSelected: (User) -> Unit,
    onToggleOnline: () -> Unit,
    onOpenProfile: () -> Unit,
    onNavigateBack: () -> Unit
) {
    var showUserMenu by Remember { mutableStateOf(false) }

    Surface(
        color = ForestPrimary,
        contentColor = Color.White,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (currentScreen != Screen.DASHBOARD) {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color.White.copy(alpha = 0.12f), CircleShape)
                            .testTag("back_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back to Dashboard",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(Color.White, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.BusinessCenter,
                            contentDescription = "Royal Hires Logo",
                            tint = ForestPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }

                Column {
                    Text(
                        text = "ROYAL HIRES",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = if (currentScreen == Screen.DASHBOARD) "MANPOWER PAYROLL" else currentScreen.title,
                        style = MaterialTheme.typography.labelSmall,
                        color = MintSurface.copy(alpha = 0.85f),
                        fontSize = 9.sp
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Online/Offline Pill
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isOnline) Color(0xFF10B981).copy(alpha = 0.2f) else Color(0xFFF59E0B).copy(alpha = 0.2f),
                    modifier = Modifier.clickable { onToggleOnline() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .background(if (isOnline) Color(0xFF34D399) else Color(0xFFFBBF24), CircleShape)
                        )
                        Text(
                            text = if (isOnline) "ONLINE" else "OFFLINE",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // User Switcher Pill
                Box {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color.White.copy(alpha = 0.12f),
                        modifier = Modifier
                            .clickable { showUserMenu = true }
                            .testTag("user_selector")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(MintSurface, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = currentUser.name.take(1),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = ForestPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = currentUser.role.label.split(" ").first(),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold
                            )
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = "Switch Role",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = showUserMenu,
                        onDismissRequest = { showUserMenu = false }
                    ) {
                        allUsers.forEach { user ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(user.name, fontWeight = FontWeight.Bold)
                                        Text(user.role.label, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                    }
                                },
                                onClick = {
                                    onUserSelected(user)
                                    showUserMenu = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RoyalHiresBottomNavigation(
    currentScreen: Screen,
    pendingOtCount: Int,
    onNavigate: (Screen) -> Unit,
    onOpenMoreMenu: () -> Unit
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 8.dp,
        modifier = Modifier.border(width = 1.dp, color = BorderSubtle)
    ) {
        val primaryScreens = listOf(
            Triple(Screen.DASHBOARD, Icons.Default.Dashboard, "Home"),
            Triple(Screen.ATTENDANCE, Icons.Default.CheckCircle, "Attendance"),
            Triple(Screen.OVERTIME, Icons.Default.AccessTime, "OT Approval"),
            Triple(Screen.PAYROLL, Icons.Default.Payments, "Payroll")
        )

        primaryScreens.forEach { (screen, icon, label) ->
            val selected = currentScreen == screen
            NavigationBarItem(
                selected = selected,
                onClick = { onNavigate(screen) },
                icon = {
                    BadgedBox(
                        badge = {
                            if (screen == Screen.OVERTIME && pendingOtCount > 0) {
                                Badge(containerColor = GoldWarning) {
                                    Text(text = pendingOtCount.toString(), color = Color.White)
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = label,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                },
                label = {
                    Text(
                        text = label,
                        fontSize = 10.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = ForestPrimary,
                    selectedTextColor = ForestPrimary,
                    indicatorColor = MintSurface,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary
                )
            )
        }

        NavigationBarItem(
            selected = currentScreen !in listOf(Screen.DASHBOARD, Screen.ATTENDANCE, Screen.OVERTIME, Screen.PAYROLL),
            onClick = onOpenMoreMenu,
            icon = {
                Icon(
                    imageVector = Icons.Default.Widgets,
                    contentDescription = "More Modules",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = "Modules",
                    fontSize = 10.sp
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = ForestPrimary,
                selectedTextColor = ForestPrimary,
                indicatorColor = MintSurface,
                unselectedIconColor = TextSecondary,
                unselectedTextColor = TextSecondary
            )
        )
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    iconBgColor: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
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
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(iconBgColor, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = iconColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun StatusBadge(
    text: String,
    textColor: Color,
    backgroundColor: Color
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = backgroundColor,
        modifier = Modifier.padding(2.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            fontSize = 10.sp
        )
    }
}
