const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  // 1. 달력에 운동 기록 목록 가져오기
  if (req.method === "GET") {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ property: "날짜", direction: "descending" }],
      });

      const records = response.results.map((page) => {
        return {
          goal: page.properties["운동 목표"]?.rich_text[0]?.plain_text || "",
          date: page.properties["날짜"]?.date?.start || "",
          type: page.properties["운동 종류"]?.rich_text[0]?.plain_text || "",
          duration: page.properties["운동 시간"]?.rich_text[0]?.plain_text || "",
          content: page.properties["내용"]?.rich_text[0]?.plain_text || "",
        };
      });

      return res.status(200).json({ status: "success", data: records });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  // 2. 새 운동 기록 노션에 저장하기
  if (req.method === "POST") {
    try {
      const { goal, date, type, duration, content } = req.body;

      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          "운동 목표": {
            rich_text: [{ text: { content: goal || "" } }],
          },
          "날짜": {
            date: { start: date || new Date().toISOString().split("T")[0] },
          },
          "운동 종류": {
            rich_text: [{ text: { content: type || "" } }],
          },
          "운동 시간": {
            rich_text: [{ text: { content: duration || "" } }],
          },
          "내용": {
            rich_text: [{ text: { content: content || "" } }],
          },
        },
      });

      return res.status(200).json({ status: "success", message: "저장 완료" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  return res.status(405).json({ message: "지원하지 않는 방식입니다." });
};