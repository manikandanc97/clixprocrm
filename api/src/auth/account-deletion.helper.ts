/**
 * Helper executing the atomic database transactions for organization and user account deletions.
 */

export async function executeAdminWorkspaceDeletionTransaction(
  tx: any,
  tenantId: string,
  userId: string,
) {
  // 1. Break circular / self-referential / non-cascading FK references
  await tx.$executeRawUnsafe(
    `UPDATE "TenantUser" SET "reportingManagerId" = NULL, "departmentId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Task" SET "relatedCustomerId" = NULL, "relatedLeadId" = NULL, "relatedMeetingId" = NULL, "relatedQuotationId" = NULL, "relatedDealId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Meeting" SET "customerId" = NULL, "leadId" = NULL, "quotationId" = NULL, "dealId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Quotation" SET "customerId" = NULL, "dealId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Deal" SET "companyId" = NULL, "customerId" = NULL, "leadId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Lead" SET "customerId" = NULL, "companyId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Customer" SET "companyId" = NULL WHERE "tenantId" = $1`,
    tenantId,
  );

  // 2. Delete child models of AI & RAG
  const convs = await tx.aiConversation.findMany({
    where: { tenantId },
    select: { id: true },
  });
  if (convs.length > 0) {
    const convIds = convs.map((c: any) => c.id);
    await tx.aiMessage.deleteMany({
      where: { conversationId: { in: convIds } },
    });
  }
  await tx.aiConversation.deleteMany({ where: { tenantId } });

  const docs = await tx.document.findMany({
    where: { tenantId },
    select: { id: true },
  });
  if (docs.length > 0) {
    const docIds = docs.map((d: any) => d.id);
    await tx.documentChunk.deleteMany({
      where: { documentId: { in: docIds } },
    });
  }
  await tx.document.deleteMany({ where: { tenantId } });
  await tx.tenantAiConfig.deleteMany({ where: { tenantId } });

  // 3. Delete tenant timeline events, attachments, notes, notifications
  await tx.timelineEvent.deleteMany({ where: { tenantId } });
  await tx.attachment.deleteMany({ where: { tenantId } });
  await tx.note.deleteMany({ where: { tenantId } });
  await tx.notification.deleteMany({ where: { tenantId } });

  // 4. Delete financial & operational records
  await tx.invoice.deleteMany({ where: { tenantId } });
  await tx.invoiceCounter.deleteMany({ where: { tenantId } });
  await tx.quotation.deleteMany({ where: { tenantId } });
  await tx.task.deleteMany({ where: { tenantId } });
  await tx.meeting.deleteMany({ where: { tenantId } });
  await tx.deal.deleteMany({ where: { tenantId } });
  await tx.lead.deleteMany({ where: { tenantId } });
  await tx.customer.deleteMany({ where: { tenantId } });
  await tx.company.deleteMany({ where: { tenantId } });
  await tx.product.deleteMany({ where: { tenantId } });
  await tx.revenueTarget.deleteMany({ where: { tenantId } });
  await tx.invitation.deleteMany({ where: { tenantId } });

  // 5. Gather all users who belong to this tenant
  const tenantUsers = await tx.tenantUser.findMany({
    where: { tenantId },
    select: { userId: true },
  });
  const userIdsInTenant: string[] = tenantUsers.map((tu: any) => tu.userId);

  // Delete tenant user memberships
  await tx.tenantUser.deleteMany({ where: { tenantId } });

  // 6. Delete roles, permissions, departments
  const roles = await tx.role.findMany({
    where: { tenantId },
    select: { id: true },
  });
  if (roles.length > 0) {
    const roleIds = roles.map((r: any) => r.id);
    await tx.rolePermission.deleteMany({
      where: { roleId: { in: roleIds } },
    });
  }
  await tx.role.deleteMany({ where: { tenantId } });
  await tx.department.deleteMany({ where: { tenantId } });

  // 7. Record ORGANIZATION_DELETED audit log (preserved permanently)
  await tx.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'ORGANIZATION_DELETED',
      module: 'Organization',
      details: {
        deletedByUserId: userId,
        reason: 'Tenant Owner deleted organization and account',
      },
    },
  });

  // 8. Delete Tenant (AuditLog rows with this tenantId remain preserved)
  await tx.tenant.delete({ where: { id: tenantId } });

  // 9. Clean up users who have no other tenant memberships (AuditLog rows preserved)
  for (const uid of userIdsInTenant) {
    const userObj = await tx.user.findUnique({
      where: { id: uid },
      select: { isSuperAdmin: true },
    });
    if (userObj?.isSuperAdmin) {
      continue; // Never delete platform Super Admin
    }

    const otherMemberships = await tx.tenantUser.count({
      where: { userId: uid },
    });
    if (otherMemberships === 0) {
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: uid,
          action: 'USER_ACCOUNT_DELETED',
          module: 'Authentication',
          details: {
            deletedUserId: uid,
            cascadeFromTenantDeletion: true,
          },
        },
      });
      await tx.user.delete({ where: { id: uid } });
    }
  }
}

export async function executeMemberAccountDeletionTransaction(
  tx: any,
  tenantId: string,
  userId: string,
  membershipId: string,
) {
  await tx.$executeRawUnsafe(
    `UPDATE "TenantUser" SET "reportingManagerId" = NULL WHERE "id" = $1 OR "reportingManagerId" = $1`,
    membershipId,
  );

  await tx.$executeRawUnsafe(
    `UPDATE "Customer" SET "assignedToId" = NULL WHERE "assignedToId" = $1 AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Lead" SET "assignedToId" = NULL, "createdById" = NULL, "updatedById" = NULL WHERE ("assignedToId" = $1 OR "createdById" = $1 OR "updatedById" = $1) AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Task" SET "assignedToId" = NULL, "createdById" = NULL, "completedById" = NULL WHERE ("assignedToId" = $1 OR "createdById" = $1 OR "completedById" = $1) AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Quotation" SET "assignedToId" = NULL WHERE "assignedToId" = $1 AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Meeting" SET "assignedToId" = NULL, "ownerId" = NULL WHERE ("assignedToId" = $1 OR "ownerId" = $1) AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Company" SET "ownerId" = NULL WHERE "ownerId" = $1 AND "tenantId" = $2`,
    userId,
    tenantId,
  );
  await tx.$executeRawUnsafe(
    `UPDATE "Deal" SET "ownerId" = NULL WHERE "ownerId" = $1 AND "tenantId" = $2`,
    userId,
    tenantId,
  );

  const convs = await tx.aiConversation.findMany({
    where: { userId, tenantId },
    select: { id: true },
  });
  if (convs.length > 0) {
    const convIds = convs.map((c: any) => c.id);
    await tx.aiMessage.deleteMany({
      where: { conversationId: { in: convIds } },
    });
  }
  await tx.aiConversation.deleteMany({ where: { userId, tenantId } });
  await tx.notification.deleteMany({ where: { userId, tenantId } });
  await tx.attachment.deleteMany({ where: { userId, tenantId } });
  await tx.note.deleteMany({ where: { userId, tenantId } });
  await tx.timelineEvent.deleteMany({ where: { userId, tenantId } });

  await tx.tenantUser.delete({ where: { id: membershipId } });

  const otherMemberships = await tx.tenantUser.count({
    where: { userId },
  });
  if (otherMemberships === 0) {
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'USER_ACCOUNT_DELETED',
        module: 'Authentication',
        details: {
          deletedUserId: userId,
          selfDeleted: true,
        },
      },
    });
    await tx.user.delete({ where: { id: userId } });
  }
}
