"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Loader2, Mail, Send, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Thread = {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string | null;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderEmail: string;
  senderName: string | null;
  senderRole: "student" | "professor";
  body: string;
  createdAt: string;
};

export function MessagesClient() {
  const { language } = useLanguage();
  const copy = {
    es: {
      loadThreadsError: "No se pudieron cargar las conversaciones.",
      loadThreadError: "No se pudo cargar esta conversación.",
      sending: "Enviando...",
      sent: "Enviado",
      generalMessage: "Mensaje general",
      you: "Tú",
      createdThreadToast:
        "Enviado. Se creó una nueva conversación en la bandeja.",
      appendedThreadToast:
        "Enviado. El mensaje se añadió a la conversación existente.",
      sendMessageError: "No se pudo enviar el mensaje.",
      sendFailed: "Error al enviar",
      replySent: "Respuesta enviada correctamente.",
      replyError: "No se pudo enviar la respuesta.",
      title: "Mensajes",
      professorSubtitle:
        "Bandeja — responde a los mensajes de estudiantes directamente desde la plataforma.",
      studentSubtitle: "Envía preguntas al Profesor Enric Vázquez.",
      inboxConversations: "Conversaciones de la bandeja",
      loading: "Cargando…",
      noMessagesYet: "Aún no hay mensajes.",
      noMessages: "Sin mensajes",
      unread: "sin leer",
      compose: "Redactar",
      subjectOptional: "Asunto (opcional)",
      writeToProfessor: "Escribe tu mensaje al Profesor Enric Vázquez...",
      send: "Enviar",
      status: "Estado",
      student: "Estudiante",
      idLabel: "ID",
      professorName: "Profesor Enric Vázquez",
      closeConversation: "Cerrar conversación",
      replyAsProfessor: "Responder como Profesor Enric Vázquez...",
      replyPlaceholder: "Escribe tu respuesta...",
      reply: "Responder",
      selectConversation:
        "Selecciona una conversación de la bandeja para abrir el chat.",
    },
    en: {
      loadThreadsError: "Unable to load conversations.",
      loadThreadError: "Unable to load this conversation.",
      sending: "Sending...",
      sent: "Sent",
      generalMessage: "General message",
      you: "You",
      createdThreadToast: "Sent. A new thread was created in the inbox.",
      appendedThreadToast:
        "Sent. Your message was added to the existing thread.",
      sendMessageError: "Unable to send the message.",
      sendFailed: "Send failed",
      replySent: "Reply sent successfully.",
      replyError: "Unable to send the reply.",
      title: "Messages",
      professorSubtitle:
        "Inbox — reply to student messages directly from the platform.",
      studentSubtitle: "Send questions to Professor Enric Vázquez.",
      inboxConversations: "Inbox conversations",
      loading: "Loading…",
      noMessagesYet: "No messages yet.",
      noMessages: "No messages",
      unread: "unread",
      compose: "Compose",
      subjectOptional: "Subject (optional)",
      writeToProfessor: "Write your message to Professor Enric Vázquez...",
      send: "Send",
      status: "Status",
      student: "Student",
      idLabel: "ID",
      professorName: "Professor Enric Vázquez",
      closeConversation: "Close conversation",
      replyAsProfessor: "Reply as Professor Enric Vázquez...",
      replyPlaceholder: "Write your reply...",
      reply: "Reply",
      selectConversation:
        "Select a conversation from the inbox to open the chat.",
    },
    fr: {
      loadThreadsError: "Impossible de charger les conversations.",
      loadThreadError: "Impossible de charger cette conversation.",
      sending: "Envoi...",
      sent: "Envoyé",
      generalMessage: "Message général",
      you: "Vous",
      createdThreadToast:
        "Envoyé. Une nouvelle conversation a été créée dans la boîte de réception.",
      appendedThreadToast:
        "Envoyé. Le message a été ajouté à la conversation existante.",
      sendMessageError: "Impossible d’envoyer le message.",
      sendFailed: "Échec de l’envoi",
      replySent: "Réponse envoyée avec succès.",
      replyError: "Impossible d’envoyer la réponse.",
      title: "Messages",
      professorSubtitle:
        "Boîte de réception — répondez aux messages des étudiants directement depuis la plateforme.",
      studentSubtitle: "Envoyez vos questions au professeur Enric Vázquez.",
      inboxConversations: "Conversations de la boîte de réception",
      loading: "Chargement…",
      noMessagesYet: "Aucun message pour le moment.",
      noMessages: "Aucun message",
      unread: "non lus",
      compose: "Rédiger",
      subjectOptional: "Objet (facultatif)",
      writeToProfessor: "Écrivez votre message au professeur Enric Vázquez...",
      send: "Envoyer",
      status: "Statut",
      student: "Étudiant",
      idLabel: "ID",
      professorName: "Professeur Enric Vázquez",
      closeConversation: "Fermer la conversation",
      replyAsProfessor: "Répondre en tant que professeur Enric Vázquez...",
      replyPlaceholder: "Écrivez votre réponse...",
      reply: "Répondre",
      selectConversation:
        "Sélectionnez une conversation dans la boîte de réception pour ouvrir le chat.",
    },
    pt: {
      loadThreadsError: "Não foi possível carregar as conversas.",
      loadThreadError: "Não foi possível carregar esta conversa.",
      sending: "Enviando...",
      sent: "Enviado",
      generalMessage: "Mensagem geral",
      you: "Você",
      createdThreadToast:
        "Enviado. Uma nova conversa foi criada na caixa de entrada.",
      appendedThreadToast:
        "Enviado. A mensagem foi adicionada à conversa existente.",
      sendMessageError: "Não foi possível enviar a mensagem.",
      sendFailed: "Erro ao enviar",
      replySent: "Resposta enviada com sucesso.",
      replyError: "Não foi possível enviar a resposta.",
      title: "Mensagens",
      professorSubtitle:
        "Caixa de entrada — responda às mensagens dos alunos diretamente pela plataforma.",
      studentSubtitle: "Envie perguntas ao Professor Enric Vázquez.",
      inboxConversations: "Conversas da caixa de entrada",
      loading: "Carregando…",
      noMessagesYet: "Ainda não há mensagens.",
      noMessages: "Sem mensagens",
      unread: "não lidas",
      compose: "Escrever",
      subjectOptional: "Assunto (opcional)",
      writeToProfessor: "Escreva sua mensagem ao Professor Enric Vázquez...",
      send: "Enviar",
      status: "Status",
      student: "Aluno",
      idLabel: "ID",
      professorName: "Professor Enric Vázquez",
      closeConversation: "Fechar conversa",
      replyAsProfessor: "Responder como Professor Enric Vázquez...",
      replyPlaceholder: "Escreva sua resposta...",
      reply: "Responder",
      selectConversation:
        "Selecione uma conversa da caixa de entrada para abrir o chat.",
    },
  }[language];
  const dateLocale =
    language === "pt"
      ? "pt-BR"
      : language === "es"
        ? "es-ES"
        : language === "fr"
          ? "fr-FR"
          : "en-US";

  const [loading, setLoading] = useState(true);
  const [isProfessor, setIsProfessor] = useState(false);
  const [professorEmail, setProfessorEmail] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId],
  );

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/messages");
      const nextThreads: Thread[] = response.data.threads || [];
      const nextIsProfessor = Boolean(response.data.isProfessor);
      setThreads(nextThreads);
      setIsProfessor(nextIsProfessor);
      setProfessorEmail(String(response.data.professorEmail || ""));
      setSelectedThreadId((current) =>
        current && nextThreads.some((thread) => thread.id === current)
          ? current
          : null,
      );
    } catch {
      toast.error(copy.loadThreadsError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadThreadsError]);

  const loadThreadMessages = useCallback(async (threadId: string) => {
    try {
      const response = await axios.get(`/api/messages/${threadId}`);
      setMessages(response.data.messages || []);
      setProfessorEmail(String(response.data.professorEmail || professorEmail));
    } catch {
      toast.error(copy.loadThreadError);
    }
  }, [copy.loadThreadError, professorEmail]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    loadThreadMessages(selectedThreadId);
  }, [loadThreadMessages, selectedThreadId]);

  const handleCreateThread = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isSending || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSending(true);
    setSendStatus(copy.sending);
    try {
      const response = await axios.post("/api/messages", {
        subject,
        message: newMessage,
      });

      const createdThreadId = String(response.data?.id || "");
      const createdAt = String(
        response.data?.createdAt || new Date().toISOString(),
      );
      const normalizedSubject = subject.trim() || copy.generalMessage;
      const pendingMessageBody = newMessage;

      if (createdThreadId) {
        const optimisticThread: Thread = {
          id: createdThreadId,
          studentId: "",
          studentEmail: "",
          studentName: null,
          subject: normalizedSubject,
          createdAt,
          updatedAt: createdAt,
          lastMessage: pendingMessageBody,
          lastMessageAt: createdAt,
          unreadCount: 0,
        };

        setThreads((previous) => {
          const exists = previous.some(
            (thread) => thread.id === createdThreadId,
          );
          if (exists) {
            return previous.map((thread) =>
              thread.id === createdThreadId
                ? {
                    ...thread,
                    subject: normalizedSubject,
                    updatedAt: createdAt,
                    lastMessage: pendingMessageBody,
                    lastMessageAt: createdAt,
                  }
                : thread,
            );
          }
          return [optimisticThread, ...previous];
        });

        setSelectedThreadId(createdThreadId);
        setMessages([
          {
            id: `local-${Date.now()}`,
            threadId: createdThreadId,
            senderId: "me",
            senderEmail: "you",
            senderName: copy.you,
            senderRole: "student",
            body: pendingMessageBody,
            createdAt,
          },
        ]);
      }

      setSubject("");
      setNewMessage("");
      loadThreads();
      if (createdThreadId) {
        loadThreadMessages(createdThreadId);
      }
      setSendStatus(copy.sent);
      const createdNewThread = Boolean(response.data?.createdNewThread);
      toast.success(
        createdNewThread ? copy.createdThreadToast : copy.appendedThreadToast,
      );
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data || copy.sendMessageError)
        : copy.sendMessageError;
      setSendStatus(copy.sendFailed);
      toast.error(message);
    } finally {
      setIsSending(false);
      submitLockRef.current = false;
    }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !selectedThreadId ||
      !replyText.trim() ||
      isSending ||
      submitLockRef.current
    )
      return;

    submitLockRef.current = true;
    setIsSending(true);
    setSendStatus(copy.sending);
    try {
      const optimisticCreatedAt = new Date().toISOString();
      const optimisticBody = replyText;

      setMessages((previous) => [
        ...previous,
        {
          id: `local-reply-${Date.now()}`,
          threadId: selectedThreadId,
          senderId: "me",
          senderEmail: "you",
          senderName: copy.you,
          senderRole: isProfessor ? "professor" : "student",
          body: optimisticBody,
          createdAt: optimisticCreatedAt,
        },
      ]);

      setThreads((previous) =>
        previous.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                updatedAt: optimisticCreatedAt,
                lastMessage: optimisticBody,
                lastMessageAt: optimisticCreatedAt,
              }
            : thread,
        ),
      );

      await axios.post(`/api/messages/${selectedThreadId}`, {
        message: replyText,
      });
      setReplyText("");
      loadThreadMessages(selectedThreadId);
      loadThreads();
      setSendStatus(copy.sent);
      toast.success(copy.replySent);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? String(error.response?.data || copy.replyError)
        : copy.replyError;
      setSendStatus(copy.sendFailed);
      toast.error(message);
    } finally {
      setIsSending(false);
      submitLockRef.current = false;
    }
  };

  const handleCloseConversation = () => {
    setSelectedThreadId(null);
    setMessages([]);
    setReplyText("");
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isProfessor ? copy.professorSubtitle : copy.studentSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-4">
        <aside className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {copy.inboxConversations}
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {copy.loading}
            </div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {copy.noMessagesYet}
            </div>
          ) : (
            <div className="space-y-2 max-h-[62dvh] overflow-y-auto pr-1">
              {threads.map((thread) => {
                const active = selectedThreadId === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {thread.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {isProfessor
                        ? `${thread.studentEmail} • ${copy.idLabel}: ${thread.studentId}`
                        : thread.lastMessage || copy.noMessages}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {new Date(thread.updatedAt).toLocaleString(dateLocale)}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex mt-1 text-[11px] px-1.5 py-0.5 rounded-full border border-primary/40 text-primary">
                        {thread.unreadCount} {copy.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
          {!isProfessor && !selectedThread && (
            <form
              onSubmit={handleCreateThread}
              className="space-y-2.5 border border-border rounded-lg p-3"
            >
              <p className="text-sm font-semibold text-foreground">
                {copy.compose}
              </p>
              <input
                type="text"
                id="message-subject"
                name="subject"
                autoComplete="off"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={copy.subjectOptional}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder={copy.writeToProfessor}
                className="w-full min-h-[110px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
              />
              <Button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {copy.send}
              </Button>
              {sendStatus && (
                <p className="text-xs text-muted-foreground">
                  {copy.status}: {sendStatus}
                </p>
              )}
            </form>
          )}

          {selectedThread ? (
            <>
              <div className="border-b border-border pb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {selectedThread.subject}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isProfessor
                      ? `${copy.student}: ${selectedThread.studentEmail} • ${copy.idLabel}: ${selectedThread.studentId}`
                      : copy.professorName}
                  </p>
                </div>
                {!isProfessor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseConversation}
                    aria-label={copy.closeConversation}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-[45dvh] overflow-y-auto pr-1">
                {messages.map((message) => {
                  return (
                    <div
                      key={message.id}
                      className="rounded-lg border border-border bg-background px-3 py-2.5"
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.senderRole === "professor"
                          ? copy.professorName
                          : message.senderName || message.senderEmail}{" "}
                        •{" "}
                        {new Date(message.createdAt).toLocaleString(dateLocale)}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {message.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={
                    isProfessor ? copy.replyAsProfessor : copy.replyPlaceholder
                  }
                  className="w-full min-h-[90px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
                />
                <Button type="submit" disabled={isSending || !replyText.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {copy.reply}
                </Button>
              </form>
            </>
          ) : !isProfessor ? null : (
            <div className="py-14 text-center text-muted-foreground text-sm">
              {copy.selectConversation}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
