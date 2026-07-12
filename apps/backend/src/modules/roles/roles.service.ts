import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../../repositories/role.repository';

@Injectable()
export class RolesService {
  constructor(private readonly roles: RoleRepository) {}

  findAll() {
    return this.roles.findAll();
  }

  findById(id: string) {
    return this.roles.findById(id);
  }
}
