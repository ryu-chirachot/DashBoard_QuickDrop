// Cloudflare Worker สำหรับจัดการ API และฐานข้อมูล D1

export default {
  async fetch(request, env, ctx) {
    // ตั้งค่า CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    // จัดการกับ OPTIONS request (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      })
    }

    // ดึง URL และเส้นทาง
    const url = new URL(request.url)
    const path = url.pathname

    try {
      // API Health Check
      if (path === "/api/health") {
        return new Response(JSON.stringify({ status: "ok", message: "Server is running" }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      // API สำหรับดึงข้อมูล Logs
      if (path === "/api/logs" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100").all()

        return new Response(JSON.stringify(results), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      // API สำหรับบันทึก Log
      if (path === "/api/logs" && request.method === "POST") {
        const data = await request.json()

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!data.senderName || !data.receiverName || !data.fileName) {
          return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          })
        }

        // กำหนดค่า timestamp ถ้าไม่มี
        const timestamp = data.timestamp || new Date().toISOString()

        // บันทึกข้อมูลลงฐานข้อมูล
        const stmt = env.DB.prepare(`
          INSERT INTO logs (senderName, senderIp, receiverName, receiverIp, fileName, fileSize, fileType, timestamp, successful)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        await stmt
          .bind(
            data.senderName,
            data.senderIp || "",
            data.receiverName,
            data.receiverIp || "",
            data.fileName,
            data.fileSize || 0,
            data.fileType || "",
            timestamp,
            data.successful ? 1 : 0,
          )
          .run()

        console.log("New Log:", data)

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        })
      }

      // ถ้าไม่ตรงกับเส้นทางใดๆ
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
      })
    } catch (error) {
      console.error("Error:", error)

      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      })
    }
  },
}

