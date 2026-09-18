import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDepartments(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.department.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  }

  async createDepartment(
    tenantId: string,
    userId: string,
    name: string,
    description?: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.department.findFirst({
        where: { tenantId, name },
      });

      if (existing) {
        throw new Error('Department already exists');
      }

      const department = await tx.department.create({
        data: {
          tenantId,
          name,
          description,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CREATE_DEPARTMENT',
          module: 'Employees',
          details: { name: department.name },
        },
      });

      return department;
    });
  }

  async updateDepartment(
    tenantId: string,
    departmentId: string,
    userId: string,
    name?: string,
    description?: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.department.findFirst({
        where: { tenantId, id: departmentId },
      });

      if (!existing) {
        throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
      }

      if (name && name !== existing.name) {
        const duplicate = await tx.department.findFirst({
          where: { tenantId, name },
        });
        if (duplicate) {
          throw new HttpException(
            'Department name already in use',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const updatedDepartment = await tx.department.update({
        where: { id: departmentId },
        data: { name, description },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'UPDATE_DEPARTMENT',
          module: 'Employees',
          details: { departmentId, name: updatedDepartment.name },
        },
      });

      return updatedDepartment;
    });
  }

  async deleteDepartment(
    tenantId: string,
    departmentId: string,
    userId: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.department.findFirst({
        where: { tenantId, id: departmentId },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!existing) {
        throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
      }

      if (existing._count.users > 0) {
        throw new HttpException(
          'Cannot delete department with assigned users',
          HttpStatus.BAD_REQUEST,
        );
      }

      await tx.department.delete({
        where: { id: departmentId },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'DELETE_DEPARTMENT',
          module: 'Employees',
          details: { departmentName: existing.name },
        },
      });

      return true;
    });
  }
}
