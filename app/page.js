"use client"

import { useEffect, useState } from "react"
import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { ArrowDownUp, CheckCircle, Clock, Database, FileType, HardDrive, XCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Register ChartJS components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalTransfers: 0,
    totalSize: 0,
    successRate: 0,
    mostActiveDevice: "-",
    mostActiveCount: 0,
  })

  const fetchLogs = async () => {
    try {
      // In production, you'd use a relative URL or environment variable
      const response = await fetch("/api/logs")
      if (!response.ok) {
        throw new Error("Failed to fetch logs")
      }
      const data = await response.json()
      setLogs(data)
      calculateStats(data)
      setLoading(false)
    } catch (err) {
      setError("Error fetching logs. Please check your server connection.")
      setLoading(false)
      console.error(err)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  const calculateStats = (logData) => {
    // Calculate total transfers
    const totalTransfers = logData.length

    // Calculate total file size
    const totalSize = logData.reduce((sum, log) => sum + log.fileSize, 0)

    // Calculate success rate
    const successfulTransfers = logData.filter((log) => log.successful).length
    const successRate = totalTransfers ? (successfulTransfers / totalTransfers) * 100 : 0

    // Find most active device
    const deviceCounts = {}
    logData.forEach((log) => {
      deviceCounts[log.senderName] = (deviceCounts[log.senderName] || 0) + 1
      deviceCounts[log.receiverName] = (deviceCounts[log.receiverName] || 0) + 1
    })

    let mostActiveDevice = "-"
    let mostActiveCount = 0

    Object.entries(deviceCounts).forEach(([device, count]) => {
      if (count > mostActiveCount) {
        mostActiveDevice = device
        mostActiveCount = count
      }
    })

    setStats({
      totalTransfers,
      totalSize,
      successRate,
      mostActiveDevice,
      mostActiveCount,
    })
  }

  // Prepare chart data
  const prepareFileTypeChartData = () => {
    const fileTypeCounts = {}
    logs.forEach((log) => {
      fileTypeCounts[log.fileType] = (fileTypeCounts[log.fileType] || 0) + 1
    })

    return {
      labels: Object.keys(fileTypeCounts),
      datasets: [
        {
          data: Object.values(fileTypeCounts),
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const prepareTimeChartData = () => {
    const timeData = {}

    // Group by date
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0]
      timeData[date] = (timeData[date] || 0) + 1
    })

    // Sort dates
    const sortedDates = Object.keys(timeData).sort()

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Transfers",
          data: sortedDates.map((date) => timeData[date]),
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    }
  }

  const prepareSuccessRateChartData = () => {
    const successData = {}

    // Group by date and success status
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0]
      if (!successData[date]) {
        successData[date] = { success: 0, fail: 0 }
      }
      if (log.successful) {
        successData[date].success += 1
      } else {
        successData[date].fail += 1
      }
    })

    // Sort dates
    const sortedDates = Object.keys(successData).sort()

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Successful",
          data: sortedDates.map((date) => successData[date].success),
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Failed",
          data: sortedDates.map((date) => successData[date].fail),
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB"
    if (bytes < 1099511627776) return (bytes / 1073741824).toFixed(2) + " GB"
    return (bytes / 1099511627776).toFixed(2) + " TB"
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              fetchLogs()
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">QuickDrop Dashboard</h1>
        <p className="text-muted-foreground">Monitor file transfers and system performance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalTransfers}</div>
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${stats.successRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold truncate">{stats.mostActiveDevice}</div>
                <div className="text-xs text-muted-foreground">{stats.mostActiveCount} transfers</div>
              </div>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transfers">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
          <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Transfers
              </CardTitle>
              <CardDescription>
                Showing the latest {logs.length} file transfers
                <Badge variant="outline" className="ml-2">
                  Auto-refresh
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{log.senderName}</div>
                          <div className="text-xs text-muted-foreground">{log.senderIp}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.receiverName}</div>
                          <div className="text-xs text-muted-foreground">{log.receiverIp}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium truncate max-w-[150px]">{log.fileName}</div>
                          <div className="text-xs text-muted-foreground">{log.fileType}</div>
                        </TableCell>
                        <TableCell>{formatFileSize(log.fileSize)}</TableCell>
                        <TableCell>
                          {log.successful ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle className="mr-1 h-3 w-3" /> Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileType className="mr-2 h-5 w-5" />
                  Transfers By File Type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Pie data={prepareFileTypeChartData()} options={{ maintainAspectRatio: false }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transfers Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Line
                  data={prepareTimeChartData()}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Success vs. Failed Transfers</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Bar
                  data={prepareSuccessRateChartData()}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true },
                      x: { stacked: false },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Performance</CardTitle>
              <CardDescription>Analysis of transfer speeds and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Average File Size</div>
                    <div className="text-sm font-medium">
                      {formatFileSize(stats.totalSize / (stats.totalTransfers || 1))}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Largest Transfer</div>
                    <div className="text-sm font-medium">
                      {formatFileSize(Math.max(...logs.map((log) => log.fileSize), 0))}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Transfers Today</div>
                    <div className="text-sm font-medium">
                      {
                        logs.filter((log) => {
                          const today = new Date().toISOString().split("T")[0]
                          const logDate = new Date(log.timestamp).toISOString().split("T")[0]
                          return today === logDate
                        }).length
                      }
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

