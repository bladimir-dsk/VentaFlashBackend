import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Estatus } from 'src/estatus/entities/estatus.entity';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/common/enums/rol.enum';
import e from 'express';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    @InjectRepository(Estatus)
    private readonly estatusRepository: Repository<Estatus>,
  ) {}
  async create(
    createEmpleadoDto: CreateEmpleadoDto,
    user: UserActiveInterface,
  ) {
    // Validar empresa según el rol
    let empresa: Empresa;
    if (user.role === Role.SOPORTE) {
      if (!createEmpleadoDto.id_empresa) {
        throw new BadRequestException(
          'El id de la empresa es requerido en el perfil de soporte',
        );
      }
      empresa = await this.empresaRepository.findOne({
        where: { id_empresa: createEmpleadoDto.id_empresa },
      });
    } else {
      empresa = await this.empresaRepository.findOne({
        where: { id_empresa: user.id_empresa },
      });
    }
  
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
  
    // Validar perfil según el rol
    let perfil;
    if (user.role === Role.SOPORTE) {
      if (!createEmpleadoDto.id_perfil) {
        throw new BadRequestException(
          'El id del perfil es requerido en el perfil de soporte',
        );
      }
      perfil = await this.perfilRepository.findOne({
        where: {
          id_perfil: createEmpleadoDto.id_perfil,
          empresa: { id_empresa: createEmpleadoDto.id_empresa },
        },
      });
    } else {
      perfil = await this.perfilRepository.findOne({
        where: {
          id_perfil: createEmpleadoDto.id_perfil,
          empresa: { id_empresa: user.id_empresa },
        },
      });
    }
  
    if (!perfil) {
      throw new BadRequestException('El perfil no existe');
    }
  
    // Validar estatus
    const estatus = await this.estatusRepository.findOneBy({
      id_estatus: createEmpleadoDto.id_estatus,
    });
    if (!estatus) {
      throw new BadRequestException('El estatus no existe');
    }
  
    // Validaciones condicionales
    let usuario = null;
  
    if (!createEmpleadoDto.aplicaEnUsuario && createEmpleadoDto.email) {
      throw new BadRequestException(
        'El campo email no debe ser enviado si "aplicaEnUsuario" es falso',
      );
    }
  
    if (createEmpleadoDto.aplicaEnUsuario) {
      if (!createEmpleadoDto.email || !createEmpleadoDto.nbNombres || !createEmpleadoDto.pwdPassword) {
        throw new BadRequestException(
          'Se requiere email, nombre y contraseña si aplicaEnUsuario es verdadero',
        );
      }
  
      // ✅ VALIDACIÓN CORREGIDA: Verificar que el email NO exista en la tabla de usuarios
      const usuarioExistente = await this.userRepository.findOneBy({
        email: createEmpleadoDto.email,
      });

     
  
      if (usuarioExistente) {
        throw new BadRequestException('Ya existe un usuario con ese email');
      }
  
      // ✅ Crear el nuevo usuario solo si NO existe
      const hashedPassword = await bcrypt.hash(createEmpleadoDto.pwdPassword, 10);
      usuario = this.userRepository.create({
        nbNombres: createEmpleadoDto.nbNombres,
        email: createEmpleadoDto.email,
        pwdPassword: hashedPassword,
        empresa,
        role: Role.EMPLEADO,
      });
  
      usuario = await this.userRepository.save(usuario);
  
      // ✅ Validar que no exista un empleado con ese email (solo si aplicaEnUsuario)
      const existingEmpleadoEmail = await this.empleadoRepository.findOne({
        where: {
          email: createEmpleadoDto.email,
          empresa: { id_empresa: empresa.id_empresa },
        },
      });
  
      if (existingEmpleadoEmail) {
        throw new BadRequestException('Ya existe un empleado con ese email para esta empresa');
      }
    }
  
    // ✅ VALIDACIONES DE UNICIDAD GLOBALES (no solo por empresa)
  
    // Validar que el email sea único en toda la tabla de empleados (global)
    if (createEmpleadoDto.email) {
      const existingEmpleadoEmailGlobal = await this.empleadoRepository.findOne({
        where: {
          email: createEmpleadoDto.email,
        },
      });
  
      if (existingEmpleadoEmailGlobal) {
        throw new BadRequestException('Ya existe un empleado con ese email');
      }
    }
  
  
    // Validar que el email personal sea único en toda la tabla de empleados (global)
    if (createEmpleadoDto.emailPersonal) {
      const existingEmpleadoEmailPersonalGlobal = await this.empleadoRepository.findOne({
        where: {
          emailPersonal: createEmpleadoDto.emailPersonal,
        },
      });
      if (existingEmpleadoEmailPersonalGlobal) {
        throw new BadRequestException('Ya existe un empleado con ese email personal');
      }
    }
  
    // Crear el empleado
    const empleado = this.empleadoRepository.create({
      ...createEmpleadoDto,
      userEmail: user.email,
      user: usuario,
      empresa,
      perfil,
      estatus,
      role: user.role,
    });
  
    return await this.empleadoRepository.save(empleado);
  }
  async createEmpleadoSoporte(createEmpleadoDto: CreateEmpleadoDto, user: UserActiveInterface) {
    // relacion con la empresa
    //apartado que valida si el soporte va a insertar un dato le debe pasar
    //el id de la empresa esto le da el permiso de insertar datos en la db
   const empresa = await this.empresaRepository.findOne({
    where: {
      id_empresa: user.id_empresa
    }
   })

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    // relacion con el perfil

    let perfil = await this.perfilRepository.findOne({
      where: {
        id_perfil: createEmpleadoDto.id_perfil,
        empresa: { id_empresa: user.id_empresa },
      },
    });

    if (!perfil) {
      throw new BadRequestException('El perfil no existe');
    }

    // relacion con el estatus
    const estatus = await this.estatusRepository.findOneBy({
      id_estatus: createEmpleadoDto.id_estatus,
    });
    if (!estatus) {
      throw new BadRequestException('El estatus no existe');
    }

    let usuario = await this.userRepository.findOneBy({
      email: createEmpleadoDto.email,
    });

    // Si el checkbox "Aplica en Usuario" está marcado y no existe, creamos el usuario
    if (createEmpleadoDto.aplicaEnUsuario && !usuario) {
      const hashedPassword = await bcrypt.hash(
        createEmpleadoDto.pwdPassword,
        10,
      ); // Encripta la contraseña
      usuario = this.userRepository.create({
        nbNombres: createEmpleadoDto.nbNombres,
        email: createEmpleadoDto.email,
        pwdPassword: hashedPassword,
        empresa: empresa,
        role: Role.SOPORTE,
      });

      usuario = await this.userRepository.save(usuario);
    }

    const empleado = this.empleadoRepository.create({
      ...createEmpleadoDto,
      userEmail: user.email,
      user: usuario,
      empresa: empresa,
      perfil: perfil,
      estatus: estatus,
      role: user.role
    });

    return await this.empleadoRepository.save(empleado);
  }

  async findAll(user: UserActiveInterface) {
   
    if (user.role === Role.SOPORTE) {
      // SOPORTE ve todos los empleados sin restricción
      return await this.empleadoRepository.find({
        relations: ['empresa', 'user', 'perfil', 'estatus']
      });
    }

    // EMPRESA y EMPLEADO solo ven empleados de su empresa
    return await this.empleadoRepository.find({
      where: { empresa: { id_empresa: user.id_empresa } },
      relations: ['empresa', 'user', 'perfil', 'estatus'],
    });
  }

  async miUsuario(user: UserActiveInterface) {
    return await this.empleadoRepository.findOne({
      where: {
        user: { email: user.email },
      },
      relations: ['empresa', 'user', 'perfil', 'estatus', 'perfil.modulo'],
    });
  }

  async findOne(id: number, user: UserActiveInterface) {
    if (user.role === Role.SOPORTE) {
      // SOPORTE ve todos los empleados sin restricción
      const empleado = await this.empleadoRepository.findOne({
        where: { id_empleado: id },
        relations: ['empresa', 'user', 'perfil', 'estatus'],
      });

      if (!empleado) {
        throw new BadRequestException('Empleado no encontrado');
      }
      return empleado;
    }
    const empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: id,
        empresa: { id_empresa: user.id_empresa },
      },
      relations: ['empresa', 'user', 'perfil', 'estatus'],
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }
    return empleado;
  }

 async update(
  id: number,
  updateEmpleadoDto: UpdateEmpleadoDto,
  user: UserActiveInterface,
) {
  let empleado: Empleado;

  if (user.role === Role.SOPORTE) {
    empleado = await this.empleadoRepository.findOne({
      where: { id_empleado: id },
      relations: ['empresa', 'perfil', 'estatus', 'user'],
    });
  } else {
    empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: id,
        empresa: { id_empresa: user.id_empresa },
      },
      relations: ['empresa', 'perfil', 'estatus', 'user'],
    });
  }

  if (!empleado) {
    throw new BadRequestException('Empleado no encontrado');
  }

  if (updateEmpleadoDto.id_perfil) {
    const perfil = await this.perfilRepository.findOne({
      where: {
        id_perfil: updateEmpleadoDto.id_perfil,
        empresa: { id_empresa: empleado.empresa.id_empresa },
      },
    });

    if (!perfil) {
      throw new BadRequestException('El perfil no existe o no pertenece a la empresa');
    }
    empleado.perfil = perfil;
  }

  if (updateEmpleadoDto.id_estatus) {
    const estatus = await this.estatusRepository.findOneBy({
      id_estatus: updateEmpleadoDto.id_estatus,
    });

    if (!estatus) {
      throw new BadRequestException('El estatus no existe');
    }
    empleado.estatus = estatus;
  }

  if (updateEmpleadoDto.email) {
    const existingEmpleadoEmailGlobal = await this.empleadoRepository.findOne({
      where: { email: updateEmpleadoDto.email },
    });

    if (existingEmpleadoEmailGlobal && existingEmpleadoEmailGlobal.id_empleado !== id) {
      throw new BadRequestException('Ya existe un empleado con ese email');
    }
  }

  if (updateEmpleadoDto.nombre) {
    const existingEmpleadoNombreGlobal = await this.empleadoRepository.findOne({
      where: { nombre: updateEmpleadoDto.nombre },
    });

    if (existingEmpleadoNombreGlobal && existingEmpleadoNombreGlobal.id_empleado !== id) {
      throw new BadRequestException('Ya existe un empleado con ese nombre');
    }
  }

  if (updateEmpleadoDto.emailPersonal) {
    const existingEmpleadoEmailPersonalGlobal = await this.empleadoRepository.findOne({
      where: { emailPersonal: updateEmpleadoDto.emailPersonal },
    });

    if (
      existingEmpleadoEmailPersonalGlobal &&
      existingEmpleadoEmailPersonalGlobal.id_empleado !== id
    ) {
      throw new BadRequestException('Ya existe un empleado con ese email personal');
    }
  }

  if (updateEmpleadoDto.aplicaEnUsuario) {
    if (!empleado.user) {
      if (!updateEmpleadoDto.email || !updateEmpleadoDto.pwdPassword || !updateEmpleadoDto.nbNombres) {
        throw new BadRequestException(
          'Para crear el usuario, se requiere email, nombre y contraseña',
        );
      }

      const existingUser = await this.userRepository.findOneBy({
        email: updateEmpleadoDto.email,
      });

      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario con ese email');
      }

      const existingUserName = await this.userRepository.findOneBy({
        nbNombres: updateEmpleadoDto.nbNombres,
      });

      if (existingUserName) {
        throw new BadRequestException('Ya existe un usuario con ese nombre');
      }

      const hashedPassword = await bcrypt.hash(updateEmpleadoDto.pwdPassword, 10);

      const newUser = this.userRepository.create({
        nbNombres: updateEmpleadoDto.nbNombres,
        email: updateEmpleadoDto.email,
        pwdPassword: hashedPassword,
        empresa: empleado.empresa,
        role: Role.EMPLEADO,
      });

      empleado.user = await this.userRepository.save(newUser);
    } else {
      if (updateEmpleadoDto.pwdPassword) {
        empleado.user.pwdPassword = await bcrypt.hash(updateEmpleadoDto.pwdPassword, 10);
      }

      if (updateEmpleadoDto.nbNombres) {
        const existingUserName = await this.userRepository.findOneBy({
          nbNombres: updateEmpleadoDto.nbNombres,
        });

        if (existingUserName && existingUserName.id !== empleado.user.id) {
          throw new BadRequestException('Ya existe otro usuario con ese nombre');
        }

        empleado.user.nbNombres = updateEmpleadoDto.nbNombres;
      }

      if (updateEmpleadoDto.email) {
        const existingUser = await this.userRepository.findOneBy({
          email: updateEmpleadoDto.email,
        });

        if (existingUser && existingUser.id !== empleado.user.id) {
          throw new BadRequestException('Ya existe otro usuario con ese email');
        }

        empleado.user.email = updateEmpleadoDto.email;
      }

      await this.userRepository.save(empleado.user);
    }
  }

  const { id_perfil, id_estatus, aplicaEnUsuario, pwdPassword, ...empleadoData } = updateEmpleadoDto;
  Object.assign(empleado, empleadoData);

  empleado.aplicaEnUsuario = aplicaEnUsuario;

  // ✅ Sincronizar nombre del usuario con el del empleado si cambió el nombre
  if (updateEmpleadoDto.nombre && empleado.user) {
    const existingUserName = await this.userRepository.findOneBy({
      nbNombres: updateEmpleadoDto.nombre,
    });

    if (existingUserName && existingUserName.id !== empleado.user.id) {
      throw new BadRequestException('Ya existe otro usuario con ese nombre');
    }

    empleado.user.nbNombres = updateEmpleadoDto.nombre;
    await this.userRepository.save(empleado.user);
  }

  return await this.empleadoRepository.save(empleado);
}


  
    
  async remove(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const empleado = await this.empleadoRepository.findOne({
        where: { id_empleado: id },
        relations: ['empresa', 'user', 'perfil', 'estatus'],
      })

      if (!empleado) {
        throw new BadRequestException('Empleado no encontrado');
      }
      return this.empleadoRepository.remove(empleado);
    }

    const empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: id,
        empresa: { id_empresa: user.id_empresa },
      },
      relations: ['empresa', 'user', 'perfil', 'estatus'],
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }
    return this.empleadoRepository.remove(empleado);
  }

  ///filtro para empleados por empresa del lado de soporte
  async findEmpleadoPorEmpresa(id_empresa: number, user: UserActiveInterface){
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con perfil de soporte pueden acceder a esta informacion');
    }

    const empresa  = await this.empresaRepository.findOne({
      where:{
        id_empresa: id_empresa
      }
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }
    const empleado = await this.empleadoRepository.find({
      where: {
        empresa: {
          id_empresa: id_empresa
        }
      }, relations: ['empresa','perfil', 'estatus', 'user']
    })
    return empleado
  }

  //filtrar por empresa para el soporte pero solo lo que aplican a usuarios
  async findEmpleadoPorEmpresaAplicaEnUsuario(id_empresa: number, user: UserActiveInterface){
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con el perfil de soporte pueden acceder a esta informacion');
    }
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: id_empresa
      }, relations: ['empleado']
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }
    
    const empleado = await this.empleadoRepository.find({
      where: {
        empresa: {
          id_empresa: id_empresa
        },
        aplicaEnUsuario: true
      }, relations: ['empresa', 'user', 'perfil', 'estatus']
    })
    return empleado
  }

  //filtrar por empresa para el soporte pero solo los que no aplican a usuarios
  async findEmpleadoPorEmpresaNoAplicaEnUsuario(id_empresa: number, user: UserActiveInterface){
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con el perfil de soporte pueden acceder a esta informacion');
    }
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: id_empresa
      }, relations: ['empleado']
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }
    
    const empleado = await this.empleadoRepository.find({
      where: {
        empresa: {
          id_empresa: id_empresa
        },
        aplicaEnUsuario: false
      }, relations: ['empresa', 'user', 'perfil', 'estatus']
    })
    return empleado
  }

  ///filtrar si aplica en usuario para la empresa
  async findEmpleadoAplicaUsuario(user: UserActiveInterface){
    if(user.role === Role.SOPORTE){
      const empleado = await this.empleadoRepository.find({
        where:{
          aplicaEnUsuario: true
        }, relations: ['empresa', 'user', 'perfil', 'estatus']
      })
      return empleado 
    }
    const empleado = await this.empleadoRepository.find({
      where:{
        empresa: {
          id_empresa: user.id_empresa
        }, 
        aplicaEnUsuario: true
      }, relations: ['empresa', 'user', 'perfil', 'estatus']
    })
    return empleado
  }

  //filtrar si no aplica en usuario para la empresa
  async findEmpleadoNoAplicaUsuario(user: UserActiveInterface){
    const empleado = await this.empleadoRepository.find({
      where:{
        empresa: {
          id_empresa: user.id_empresa
        }, 
        aplicaEnUsuario: false
      }, relations: ['empresa', 'user', 'perfil', 'estatus']
    })
    return empleado
  }

  //filtrar soporte por empresa
  async filterSoporteEmployeesPorEmpresa(id_empresa: number, user: UserActiveInterface) {
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con el perfil de soporte pueden acceder a esta informacion');
    }
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: id_empresa
      }, relations: ['empleado']
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }
    
    const empleado = await this.empleadoRepository.find({
      where: {
        empresa: {
          id_empresa: id_empresa
        },
        role: Role.SOPORTE
      }, relations: ['empresa', 'user', 'perfil', 'estatus']
    })
    return empleado
  }

}
