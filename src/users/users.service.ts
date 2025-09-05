import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Empresa) private readonly empresaRepository: Repository<Empresa>
  ){}

  create(createUserDto: CreateUserDto) {
    return this.usersRepository.save(createUserDto);
  }

  //creamos un metodo para que me busque el usuario en la base de datos
  findOneByEmail(email: string) {
    return this.usersRepository.findOneBy({email});
  }
  //buscar por email con password
  //metodo que busca el email para que me traiga los daemas datos del usuario
  finByEmailWithPassword(email: string) {
    return this.usersRepository.findOne({
    where: {email}, 
    select: ['id', 'nbNombres', 'email', 'pwdPassword', 'role'],
    relations: ['empresa']
      
    } );
  }

  findAll() {
    return this.usersRepository.find(
      {relations: ['empresa', 'pagos.planVigencia']}
    );
  }

  findUsuariosEmpresa(){
    return this.usersRepository.find({
      where: {
        role: Role.EMPRESA
      }, relations: ['empresa', 'pagos.planVigencia']
    })
  }

  findUsuariosEmpleado(){
    return this.usersRepository.find({
      where: {
        role: Role.EMPLEADO
      }, relations: ['empresa', 'pagos.planVigencia']
    })
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({id});
  }


  remove(id: number) {
    return `This action removes a #${id} user`;
  }
  async miUsuario(user: UserActiveInterface) {
    return await this.usersRepository.findOne({
      where: { email: user.email },
      relations: ['empresa'], // Asegurar que empresa.pago está en las relaciones
    });
  }











  // Primero, actualiza el método update en UsersService
async update(id: number, updateUserDto: UpdateUserDto) {
 // Debug log
  
  // Verificar si el usuario existe
  const user = await this.usersRepository.findOne({
    where: { id },
    relations: ['empresa', 'perfil'] // Agregamos la relación perfil para manejarla
  });

  if (!user) {
    throw new BadRequestException('Usuario no encontrado');
  }


  // Crear objeto para actualizar
  const updateData: any = {};

  // Si se está actualizando el email, verificar que no exista otro usuario con ese email
  if (updateUserDto.email && updateUserDto.email.trim() !== '' && updateUserDto.email !== user.email) {
    const existingUser = await this.findOneByEmail(updateUserDto.email);
    if (existingUser && existingUser.id !== id) {
      throw new BadRequestException('El email ya está registrado por otro usuario');
    }
    updateData.email = updateUserDto.email.trim();
  }

  // Si se está actualizando la contraseña, hashearla
  if (updateUserDto.pwdPassword && updateUserDto.pwdPassword.trim() !== '') {
    updateData.pwdPassword = await bcryptjs.hash(updateUserDto.pwdPassword, 10);
    console.log('Contraseña hasheada correctamente'); // Debug log
  }

  // Agregar otros campos si están presentes
  if (updateUserDto.nbNombres !== undefined) {
    updateData.nbNombres = updateUserDto.nbNombres;
  }
 
  if (updateUserDto.role !== undefined) {
    updateData.role = updateUserDto.role;
  }


  // Usar QueryRunner para manejar la transacción y evitar problemas de FK
  const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Actualizar los datos del usuario usando el queryRunner
    if (Object.keys(updateData).length > 0) {
      // Usar el queryRunner para la actualización
      await queryRunner.manager.update('User', { id }, updateData);
      console.log('Usuario actualizado en la base de datos'); // Debug log
    } else {
      console.log('No hay datos para actualizar'); // Debug log
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error durante la actualización:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }

  // Retornar el usuario actualizado
  return await this.usersRepository.findOne({
    where: { id },
    relations: ['empresa']
  });
}

// Método alternativo más seguro que actualiza campos individualmente
async updateSafe(id: number, updateUserDto: UpdateUserDto) {

  
  // Verificar si el usuario existe - IMPORTANTE: incluir pwdPassword en el select
  const user = await this.usersRepository.findOne({
    where: { id },
    relations: ['empresa'],
    select: ['id', 'email', 'pwdPassword', 'nbNombres', 'role'] // Especificar explícitamente los campos incluyendo pwdPassword
  });

  if (!user) {
    throw new BadRequestException('Usuario no encontrado');
  }

  // Actualizar campo por campo para evitar conflictos de FK
  let hasChanges = false;

  // Actualizar nombre si es diferente
  if (updateUserDto.nbNombres !== undefined && updateUserDto.nbNombres !== user.nbNombres) {
    user.nbNombres = updateUserDto.nbNombres;
    hasChanges = true;
    console.log('Nombre actualizado');
  }

  // Actualizar contraseña si es diferente
  if (updateUserDto.pwdPassword && updateUserDto.pwdPassword.trim() !== '') {
    // Verificar que user.pwdPassword existe antes de comparar
    if (user.pwdPassword) {
      const isSamePassword = await bcryptjs.compare(updateUserDto.pwdPassword, user.pwdPassword);
      if (!isSamePassword) {
        user.pwdPassword = await bcryptjs.hash(updateUserDto.pwdPassword, 10);
        hasChanges = true;
       
      } else {
       
      }
    } else {
      // Si no hay contraseña actual, establecer la nueva
      user.pwdPassword = await bcryptjs.hash(updateUserDto.pwdPassword, 10);
      hasChanges = true;
      
    }
  }

  // Actualizar email si es diferente (esto se hace al final y con más cuidado)
  if (updateUserDto.email && updateUserDto.email.trim() !== '' && updateUserDto.email !== user.email) {
    const existingUser = await this.findOneByEmail(updateUserDto.email);
    if (existingUser && existingUser.id !== id) {
      throw new BadRequestException('El email ya está registrado por otro usuario');
    }
    user.email = updateUserDto.email.trim();
    hasChanges = true;
    console.log('Email actualizado');
  }

  if (updateUserDto.role !== undefined && updateUserDto.role !== user.role) {
    user.role = updateUserDto.role;
    hasChanges = true;
    console.log('Rol actualizado');
  }

  if (hasChanges) {
    try {
      const updatedUser = await this.usersRepository.save(user);
      console.log('Usuario guardado exitosamente');
      
      // Retornar el usuario sin la contraseña por seguridad
      const { pwdPassword, ...userWithoutPassword } = updatedUser;
      return { ...userWithoutPassword, empresa: updatedUser.empresa };
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('No se puede actualizar el usuario debido a restricciones de datos relacionados');
      }
      throw error;
    }
  }

  console.log('No hay cambios para actualizar');
  // Retornar el usuario sin la contraseña por seguridad
  const { pwdPassword, ...userWithoutPassword } = user;
  return { ...userWithoutPassword, empresa: user.empresa };
}

// Método adicional para actualizar el perfil del usuario autenticado (usando método seguro)
async updateProfile(user: UserActiveInterface, updateUserDto: UpdateUserDto) {
  const currentUser = await this.usersRepository.findOne({
    where: { email: user.email },
    relations: ['empresa']
  });

  if (!currentUser) {
    throw new BadRequestException('Usuario no encontrado');
  }

  // Usar el método seguro para actualizar
  return await this.updateSafe(currentUser.id, updateUserDto);
}
}
