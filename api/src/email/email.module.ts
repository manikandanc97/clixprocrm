import { Module, forwardRef } from '@nestjs/common';
import { EmailAccountsController } from './controllers/email-accounts.controller';
import { EmailAccountsService } from './services/email-accounts.service';
import { ConnectionVerifierService } from './services/connection-verifier.service';
import { MimeParserService } from './services/mime-parser.service';
import { EmailHtmlSanitizerService } from './services/email-html-sanitizer.service';
import { EmailAttachmentStorageService } from './services/email-attachment-storage.service';
import { ImapClientFactory } from './services/imap-client.factory';
import { InboundEmailService } from './services/inbound-email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [EmailAccountsController],
  providers: [
    EmailAccountsService,
    ConnectionVerifierService,
    MimeParserService,
    EmailHtmlSanitizerService,
    EmailAttachmentStorageService,
    ImapClientFactory,
    InboundEmailService,
  ],
  exports: [
    EmailAccountsService,
    ConnectionVerifierService,
    InboundEmailService,
    EmailAttachmentStorageService,
    MimeParserService,
    EmailHtmlSanitizerService,
    ImapClientFactory,
  ],
})
export class EmailModule {}
