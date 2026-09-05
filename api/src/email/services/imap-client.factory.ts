import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';

export interface ImapClientOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass?: string;
    accessToken?: string;
  };
  logger?: boolean;
}

export interface FetchedImapMessage {
  uid: number;
  seq: number;
  source: Buffer;
  internalDate?: Date;
  externalThreadId?: string | null;
}

export interface IImapClient {
  connect(): Promise<void>;
  logout(): Promise<void>;
  close(): Promise<void>;
  fetchMessages(
    folder: string,
    fromUid: number,
    limit?: number,
  ): Promise<FetchedImapMessage[]>;
}

export class ImapFlowClientWrapper implements IImapClient {
  private client: ImapFlow;
  private isConnected = false;

  constructor(options: ImapClientOptions) {
    this.client = new ImapFlow({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.auth.user,
        pass: options.auth.pass,
        accessToken: options.auth.accessToken,
      },
      logger: false, // Crucial: strictly prevent credentials or message content from leaking into default logger
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.isConnected = true;
  }

  async logout(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.logout();
      } finally {
        this.isConnected = false;
      }
    }
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.close();
      } finally {
        this.isConnected = false;
      }
    }
  }

  async fetchMessages(
    folder = 'INBOX',
    fromUid = 1,
    limit = 50,
  ): Promise<FetchedImapMessage[]> {
    const lock = await this.client.getMailboxLock(folder);
    const messages: FetchedImapMessage[] = [];

    try {
      // If mailbox is empty (exists === 0), return early
      const mailbox = this.client.mailbox;
      if (!mailbox || (mailbox as any).exists === 0) {
        return [];
      }

      // Query UIDs starting from fromUid
      // IMAP UID sequence: `${fromUid}:*`
      const range = `${fromUid}:*`;
      const generator = this.client.fetch(range, {
        uid: true,
        source: true,
        internalDate: true,
        threadId: true,
      }, { uid: true });

      for await (const msg of generator) {
        if (msg.uid < fromUid) {
          continue;
        }

        messages.push({
          uid: msg.uid,
          seq: msg.seq,
          source: msg.source || Buffer.alloc(0),
          internalDate: msg.internalDate ? new Date(msg.internalDate) : undefined,
          externalThreadId: (msg as any).threadId ? String((msg as any).threadId) : null,
        });

        if (messages.length >= limit) {
          break;
        }
      }

      // Sort in ascending UID order so cursor advances monotonically
      messages.sort((a, b) => a.uid - b.uid);
      return messages;
    } finally {
      lock.release();
    }
  }
}

@Injectable()
export class ImapClientFactory {
  private readonly logger = new Logger(ImapClientFactory.name);

  createClient(options: ImapClientOptions): IImapClient {
    return new ImapFlowClientWrapper(options);
  }
}
