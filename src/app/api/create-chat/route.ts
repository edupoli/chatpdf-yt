import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Buscar a sessão usando NextAuth
  const session = await getSession({ req });

  // Verificar se o usuário está autenticado pela presença da sessão
  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    // Supõe-se que o corpo da requisição já esteja parseado pelo Next.js
    const { file_key, file_name } = req.body;
    console.log(file_key, file_name);

    // Sua lógica de negócios segue aqui
    await loadS3IntoPinecone(file_key);

    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId: session?.user?.email!,
      })
      .returning({
        insertedId: chats.id,
      });

    // Resposta bem-sucedida
    res.status(200).json({ chat_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}
