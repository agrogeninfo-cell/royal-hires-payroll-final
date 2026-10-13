package com.aistudio.royalhires.viewmodel

import androidx.lifecycle.ViewModel
import com.aistudio.royalhires.data.RoyalHiresRepository
import com.aistudio.royalhires.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

class RoyalHiresViewModel(
    val repository: RoyalHiresRepository = RoyalHiresRepository()
) : ViewModel() {

    val users = repository.users
    val currentUser = repository.currentUser
    val factories = repository.factories
    val employees = repository.employees
    val boardingLocations = repository.boardingLocations
    val attendance = repository.attendance
    val payrollRuns = repository.payrollRuns
    val invoices = repository.invoices
    val receipts = repository.receipts
    val auditLogs = repository.auditLogs
    val isOnline = repository.isOnline

    private val _currentScreen = MutableStateFlow(Screen.DASHBOARD)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val _selectedDate = MutableStateFlow(
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    )
    val selectedDate: StateFlow<String> = _selectedDate.asStateFlow()

    private val _selectedFactoryFilter = MutableStateFlow<String?>(null)
    val selectedFactoryFilter: StateFlow<String?> = _selectedFactoryFilter.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    fun navigateTo(screen: Screen) {
        _currentScreen.value = screen
    }

    fun setSelectedDate(date: String) {
        _selectedDate.value = date
    }

    fun setSelectedFactoryFilter(factoryId: String?) {
        _selectedFactoryFilter.value = factoryId
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setCurrentUser(user: User) {
        repository.setCurrentUser(user)
    }

    fun toggleOnline() {
        repository.toggleOnline()
    }

    fun approveOvertime(attendanceId: String, approve: Boolean) {
        repository.approveOvertime(attendanceId, approve)
    }

    fun saveAttendance(record: AttendanceRecord) {
        repository.saveAttendance(record)
    }

    fun saveFactory(factory: Factory) {
        repository.saveFactory(factory)
    }

    fun saveEmployee(employee: Employee) {
        repository.saveEmployee(employee)
    }

    fun saveBoarding(boarding: BoardingLocation) {
        repository.saveBoarding(boarding)
    }

    fun generatePayroll(periodStart: String, periodEnd: String) {
        repository.generatePayrollRun(periodStart, periodEnd)
    }

    fun generateInvoice(factoryId: String, periodStart: String, periodEnd: String) {
        repository.generateInvoice(factoryId, periodStart, periodEnd)
    }

    fun recordReceipt(receipt: FactoryReceipt) {
        repository.recordReceipt(receipt)
    }
}
