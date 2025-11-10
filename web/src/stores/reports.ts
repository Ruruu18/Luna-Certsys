import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CertificateRequest {
  id: string
  certificate_type: string
  status: string
  payment_status: string
  payment_amount: number
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
    purok?: string
  }
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  purok?: string
  phone_number?: string
  created_at: string
}

interface ReportData {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  completedRequests: number
  rejectedRequests: number
  totalRevenue: number
  requestsByType: { [key: string]: number }
  requestsByPurok: { [key: string]: number }
  requestsByMonth: { [key: string]: number }
}

export const useReportsStore = defineStore('reports', {
  state: () => ({
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchCertificateRequests(
      startDate?: string,
      endDate?: string
    ): Promise<CertificateRequest[]> {
      try {
        let query = supabase
          .from('certificate_requests')
          .select(`
            id,
            certificate_type,
            status,
            payment_status,
            payment_amount,
            created_at,
            updated_at,
            users!certificate_requests_user_id_fkey (
              full_name,
              email,
              purok
            )
          `)
          .order('created_at', { ascending: false })

        if (startDate) {
          query = query.gte('created_at', startDate)
        }
        if (endDate) {
          // Add one day to include the end date
          const endDateTime = new Date(endDate)
          endDateTime.setDate(endDateTime.getDate() + 1)
          query = query.lt('created_at', endDateTime.toISOString().split('T')[0])
        }

        const { data, error } = await query

        if (error) throw error

        // Transform the data to match our interface
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          certificate_type: item.certificate_type,
          status: item.status,
          payment_status: item.payment_status,
          payment_amount: item.payment_amount,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user: item.users ? {
            full_name: item.users.full_name,
            email: item.users.email,
            purok: item.users.purok
          } : undefined
        }))

        return transformedData
      } catch (error) {
        console.error('Error fetching certificate requests:', error)
        return []
      }
    },

    async fetchAllUsers(): Promise<User[]> {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role, purok, phone_number, created_at')
          .neq('role', 'admin')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching users:', error)
        return []
      }
    },

    analyzeData(requests: CertificateRequest[]): ReportData {
      const data: ReportData = {
        totalRequests: requests.length,
        pendingRequests: 0,
        approvedRequests: 0,
        completedRequests: 0,
        rejectedRequests: 0,
        totalRevenue: 0,
        requestsByType: {},
        requestsByPurok: {},
        requestsByMonth: {}
      }

      requests.forEach((request) => {
        // Status counts
        switch (request.status.toLowerCase()) {
          case 'pending':
            data.pendingRequests++
            break
          case 'approved':
          case 'processing':
            data.approvedRequests++
            break
          case 'completed':
            data.completedRequests++
            break
          case 'rejected':
          case 'cancelled':
            data.rejectedRequests++
            break
        }

        // Revenue
        if (request.payment_status === 'paid' && request.payment_amount) {
          data.totalRevenue += request.payment_amount
        }

        // By type
        const type = request.certificate_type || 'Unknown'
        data.requestsByType[type] = (data.requestsByType[type] || 0) + 1

        // By purok
        const purok = request.user?.purok || 'Unknown'
        data.requestsByPurok[purok] = (data.requestsByPurok[purok] || 0) + 1

        // By month
        const date = new Date(request.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        data.requestsByMonth[monthKey] = (data.requestsByMonth[monthKey] || 0) + 1
      })

      return data
    },

    async generateSummaryPDF(
      reportData: ReportData,
      startDate: string,
      endDate: string
    ): Promise<void> {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Header
      doc.setFontSize(20)
      doc.setTextColor(30, 64, 175)
      doc.text('Barangay Luna Certificate System', pageWidth / 2, yPos, { align: 'center' })
      yPos += 8

      doc.setFontSize(16)
      doc.setTextColor(74, 144, 226)
      doc.text('Certificate Requests Summary Report', pageWidth / 2, yPos, { align: 'center' })
      yPos += 12

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, {
        align: 'center'
      })
      yPos += 5
      doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Summary Cards
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Overview', 14, yPos)
      yPos += 10

      const summaryData = [
        ['Total Requests', reportData.totalRequests.toString()],
        ['Pending', reportData.pendingRequests.toString()],
        ['Approved/Processing', reportData.approvedRequests.toString()],
        ['Completed', reportData.completedRequests.toString()],
        ['Rejected', reportData.rejectedRequests.toString()],
        ['Total Revenue', `₱${reportData.totalRevenue.toLocaleString()}`],
        [
          'Completion Rate',
          reportData.totalRequests > 0
            ? `${Math.round((reportData.completedRequests / reportData.totalRequests) * 100)}%`
            : '0%'
        ]
      ]

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [74, 144, 226], textColor: 255 },
        margin: { left: 14, right: 14 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Requests by Type
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Requests by Certificate Type', 14, yPos)
      yPos += 5

      const typeData = Object.entries(reportData.requestsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const percentage =
            reportData.totalRequests > 0
              ? ((count / reportData.totalRequests) * 100).toFixed(1)
              : '0.0'
          return [type, count.toString(), `${percentage}%`]
        })

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Certificate Type', 'Count', 'Percentage']],
        body: typeData,
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226], textColor: 255 },
        margin: { left: 14, right: 14 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Requests by Purok
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Requests by Purok', 14, yPos)
      yPos += 5

      const purokData = Object.entries(reportData.requestsByPurok)
        .sort((a, b) => b[1] - a[1])
        .map(([purok, count]) => {
          const percentage =
            reportData.totalRequests > 0
              ? ((count / reportData.totalRequests) * 100).toFixed(1)
              : '0.0'
          return [purok, count.toString(), `${percentage}%`]
        })

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Purok', 'Count', 'Percentage']],
        body: purokData,
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226], textColor: 255 },
        margin: { left: 14, right: 14 }
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(127, 140, 141)
        doc.text(
          `Official Document - Barangay Luna Certificate Management System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      doc.save(`summary-report-${startDate}-to-${endDate}.pdf`)
    },

    async generateDetailedPDF(
      requests: CertificateRequest[],
      startDate: string,
      endDate: string
    ): Promise<void> {
      const doc = new jsPDF('landscape')
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Header
      doc.setFontSize(18)
      doc.setTextColor(30, 64, 175)
      doc.text('Barangay Luna Certificate System', pageWidth / 2, yPos, { align: 'center' })
      yPos += 7

      doc.setFontSize(14)
      doc.setTextColor(74, 144, 226)
      doc.text('Detailed Certificate Requests Report', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, {
        align: 'center'
      })
      yPos += 4
      doc.text(`Period: ${startDate} to ${endDate} | Total Records: ${requests.length}`, pageWidth / 2, yPos, {
        align: 'center'
      })
      yPos += 10

      // Table
      const tableData = requests.map((req) => [
        new Date(req.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        req.user?.full_name || 'N/A',
        req.user?.email || 'N/A',
        req.user?.purok || 'N/A',
        req.certificate_type,
        req.status.toUpperCase(),
        req.payment_status.toUpperCase(),
        `₱${req.payment_amount || 0}`
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Resident Name', 'Email', 'Purok', 'Certificate Type', 'Status', 'Payment', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [74, 144, 226], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(127, 140, 141)
        doc.text(
          `Official Document - Barangay Luna Certificate Management System | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      doc.save(`detailed-report-${startDate}-to-${endDate}.pdf`)
    },

    async generateUsersPDF(users: User[]): Promise<void> {
      const doc = new jsPDF('landscape')
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Header
      doc.setFontSize(18)
      doc.setTextColor(30, 64, 175)
      doc.text('Barangay Luna Certificate System', pageWidth / 2, yPos, { align: 'center' })
      yPos += 7

      doc.setFontSize(14)
      doc.setTextColor(74, 144, 226)
      doc.text('Registered Users Report', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, {
        align: 'center'
      })
      yPos += 4
      doc.text(`Total Users: ${users.length}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Table
      const tableData = users.map((user) => [
        user.full_name,
        user.email,
        user.phone_number || 'N/A',
        user.role.replace('_', ' ').toUpperCase(),
        user.purok || 'N/A',
        new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Name', 'Email', 'Phone', 'Role', 'Purok', 'Registered Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(127, 140, 141)
        doc.text(
          `Official Document - Barangay Luna Certificate Management System | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`)
    },

    async generatePaymentsPDF(
      requests: CertificateRequest[],
      startDate: string,
      endDate: string
    ): Promise<void> {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Filter paid requests
      const paidRequests = requests.filter(r => r.payment_status === 'paid')
      const totalRevenue = paidRequests.reduce((sum, r) => sum + (r.payment_amount || 0), 0)

      // Header
      doc.setFontSize(18)
      doc.setTextColor(30, 64, 175)
      doc.text('Barangay Luna Certificate System', pageWidth / 2, yPos, { align: 'center' })
      yPos += 7

      doc.setFontSize(14)
      doc.setTextColor(74, 144, 226)
      doc.text('Payments & Revenue Report', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, {
        align: 'center'
      })
      yPos += 4
      doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Summary
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Revenue Summary', 14, yPos)
      yPos += 5

      const summaryData = [
        ['Total Paid Transactions', paidRequests.length.toString()],
        ['Total Revenue', `₱${totalRevenue.toLocaleString()}`],
        ['Average Transaction Amount', paidRequests.length > 0 ? `₱${Math.round(totalRevenue / paidRequests.length).toLocaleString()}` : '₱0']
      ]

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [74, 144, 226], textColor: 255 },
        margin: { left: 14, right: 14 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Detailed transactions
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Paid Transactions', 14, yPos)
      yPos += 5

      const tableData = paidRequests.map((req) => [
        new Date(req.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        req.user?.full_name || 'N/A',
        req.certificate_type,
        `₱${req.payment_amount || 0}`
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Date', 'Customer', 'Certificate Type', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [74, 144, 226], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(127, 140, 141)
        doc.text(
          `Official Document - Barangay Luna Certificate Management System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      doc.save(`payments-report-${startDate}-to-${endDate}.pdf`)
    },

    async downloadReport(
      type: 'summary' | 'detailed' | 'users' | 'payments',
      startDate: string,
      endDate: string
    ): Promise<void> {
      try {
        this.loading = true
        this.error = null

        switch (type) {
          case 'summary': {
            const requests = await this.fetchCertificateRequests(startDate, endDate)
            const reportData = this.analyzeData(requests)
            await this.generateSummaryPDF(reportData, startDate, endDate)
            break
          }
          case 'detailed': {
            const requests = await this.fetchCertificateRequests(startDate, endDate)
            await this.generateDetailedPDF(requests, startDate, endDate)
            break
          }
          case 'users': {
            const users = await this.fetchAllUsers()
            await this.generateUsersPDF(users)
            break
          }
          case 'payments': {
            const requests = await this.fetchCertificateRequests(startDate, endDate)
            await this.generatePaymentsPDF(requests, startDate, endDate)
            break
          }
        }
      } catch (error) {
        console.error('Error generating report:', error)
        this.error = 'Failed to generate report'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
