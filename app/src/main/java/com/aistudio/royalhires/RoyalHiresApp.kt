package com.aistudio.royalhires

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aistudio.royalhires.model.Screen
import com.aistudio.royalhires.ui.components.RoyalHiresBottomNavigation
import com.aistudio.royalhires.ui.components.RoyalHiresTopBar
import com.aistudio.royalhires.ui.screens.*
import com.aistudio.royalhires.ui.theme.ForestPrimary
import com.aistudio.royalhires.viewmodel.RoyalHiresViewModel

@Composable
fun RoyalHiresApp(
    viewModel: RoyalHiresViewModel = viewModel()
) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val allUsers by viewModel.users.collectAsState()
    val factories by viewModel.factories.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val boardingLocations by viewModel.boardingLocations.collectAsState()
    val attendance by viewModel.attendance.collectAsState()
    val payrollRuns by viewModel.payrollRuns.collectAsState()
    val invoices by viewModel.invoices.collectAsState()
    val receipts by viewModel.receipts.collectAsState()
    val auditLogs by viewModel.auditLogs.collectAsState()
    val isOnline by viewModel.isOnline.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val selectedFactoryFilter by viewModel.selectedFactoryFilter.collectAsState()

    var showQuickActionDialog by remember { mutableStateOf(false) }
    var showModulesDialog by remember { mutableStateOf(false) }

    val pendingOtCount = attendance.count { it.otHours > 0 && it.submissionStatus == com.aistudio.royalhires.model.SubmissionStatus.SUBMITTED }

    // Hardware/System back navigation: return to dashboard if on another screen
    BackHandler(enabled = currentScreen != Screen.DASHBOARD) {
        viewModel.navigateTo(Screen.DASHBOARD)
    }

    Scaffold(
        topBar = {
            RoyalHiresTopBar(
                currentScreen = currentScreen,
                currentUser = currentUser,
                allUsers = allUsers,
                isOnline = isOnline,
                pendingOtCount = pendingOtCount,
                onUserSelected = { viewModel.setCurrentUser(it) },
                onToggleOnline = { viewModel.toggleOnline() },
                onOpenProfile = { viewModel.navigateTo(Screen.PROFILE) },
                onNavigateBack = { viewModel.navigateTo(Screen.DASHBOARD) }
            )
        },
        bottomBar = {
            RoyalHiresBottomNavigation(
                currentScreen = currentScreen,
                pendingOtCount = pendingOtCount,
                onNavigate = { viewModel.navigateTo(it) },
                onOpenMoreMenu = { showModulesDialog = true }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showQuickActionDialog = true },
                containerColor = ForestPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("fab_quick_action")
            ) {
                Icon(
                    imageVector = Icons.Default.Bolt,
                    contentDescription = "Quick Actions",
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentScreen) {
                Screen.DASHBOARD -> DashboardScreen(
                    factories = factories,
                    employees = employees,
                    attendance = attendance,
                    payrollRuns = payrollRuns,
                    invoices = invoices,
                    receipts = receipts,
                    onNavigate = { viewModel.navigateTo(it) },
                    onQuickAction = { showQuickActionDialog = true }
                )
                Screen.ATTENDANCE -> AttendanceScreen(
                    attendance = attendance,
                    employees = employees,
                    factories = factories,
                    selectedDate = selectedDate,
                    selectedFactoryFilter = selectedFactoryFilter,
                    onDateSelected = { viewModel.setSelectedDate(it) },
                    onFactorySelected = { viewModel.setSelectedFactoryFilter(it) },
                    onSaveAttendance = { viewModel.saveAttendance(it) }
                )
                Screen.OVERTIME -> OvertimeScreen(
                    attendance = attendance,
                    factories = factories,
                    onApprove = { id, approved -> viewModel.approveOvertime(id, approved) }
                )
                Screen.FACTORIES -> FactoriesScreen(
                    factories = factories,
                    onSaveFactory = { viewModel.saveFactory(it) }
                )
                Screen.EMPLOYEES -> EmployeesScreen(
                    employees = employees,
                    factories = factories,
                    boardingLocations = boardingLocations,
                    onSaveEmployee = { viewModel.saveEmployee(it) }
                )
                Screen.BOARDING -> BoardingScreen(
                    boardingLocations = boardingLocations,
                    employees = employees,
                    onSaveBoarding = { viewModel.saveBoarding(it) }
                )
                Screen.PAYROLL -> PayrollScreen(
                    payrollRuns = payrollRuns,
                    onGeneratePayroll = { start, end -> viewModel.generatePayroll(start, end) }
                )
                Screen.INVOICES -> InvoicesScreen(
                    invoices = invoices,
                    factories = factories,
                    onGenerateInvoice = { facId, start, end -> viewModel.generateInvoice(facId, start, end) }
                )
                Screen.RECEIPTS -> ReceiptsScreen(
                    receipts = receipts,
                    factories = factories,
                    invoices = invoices,
                    onRecordReceipt = { viewModel.recordReceipt(it) }
                )
                Screen.REPORTS -> ReportsScreen(
                    factories = factories,
                    employees = employees,
                    attendance = attendance,
                    payrollRuns = payrollRuns,
                    invoices = invoices,
                    receipts = receipts
                )
                Screen.AUDIT -> AuditScreen(
                    auditLogs = auditLogs
                )
                Screen.PROFILE -> ProfileScreen(
                    currentUser = currentUser,
                    allUsers = allUsers,
                    onSelectUser = { viewModel.setCurrentUser(it) }
                )
            }
        }
    }

    if (showQuickActionDialog) {
        QuickActionDialog(
            onDismiss = { showQuickActionDialog = false },
            onNavigate = { viewModel.navigateTo(it) }
        )
    }

    if (showModulesDialog) {
        ModulesDialog(
            currentScreen = currentScreen,
            onDismiss = { showModulesDialog = false },
            onNavigate = { viewModel.navigateTo(it) }
        )
    }
}
