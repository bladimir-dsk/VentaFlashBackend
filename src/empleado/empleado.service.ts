import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Estatus } from 'src/estatus/entities/estatus.entity';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/common/enums/rol.enum';
import e from 'express';
import { Caja } from 'src/cajas/entities/caja.entity';

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
    @InjectRepository(Caja) private readonly cajaRepository: Repository<Caja>
  ) {}
  async create(
  createEmpleadoDto: CreateEmpleadoDto,
  user: UserActiveInterface,
) {
 
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

  const estatus = await this.estatusRepository.findOneBy({
    id_estatus: createEmpleadoDto.id_estatus,
  });
  if (!estatus) {
    throw new BadRequestException('El estatus no existe');
  }

  let usuario = null;
  let caja = null;

  if (!createEmpleadoDto.aplicaEnUsuario && createEmpleadoDto.email) {
    throw new BadRequestException(
      'El campo email no debe ser enviado si "aplicaEnUsuario" es falso',
    );
  }

  if (createEmpleadoDto.aplicaEnUsuario) {
    if (!createEmpleadoDto.email || !createEmpleadoDto.nbNombres || !createEmpleadoDto.pwdPassword || !createEmpleadoDto.id_caja) {
      throw new BadRequestException(
        'Se requiere email, nombre, caja y contraseña si aplicaEnUsuario es verdadero',
      );
    }

    caja = await this.cajaRepository.findOne({
      where: {
        id_caja: createEmpleadoDto.id_caja,
        empresa: { id_empresa: user.role === Role.SOPORTE ? createEmpleadoDto.id_empresa : user.id_empresa }
      }
    });

    if (!caja) {
      throw new BadRequestException('La caja no existe');
    }

    const cajaOcupada = await this.empleadoRepository.findOne({
      where: {
        caja: { id_caja: createEmpleadoDto.id_caja },
        empresa: { id_empresa: user.role === Role.SOPORTE ? createEmpleadoDto.id_empresa : user.id_empresa },
        user: Not(IsNull())
      },
      relations: ['user', 'caja', 'empresa']
    });

    if (cajaOcupada) {
      throw new BadRequestException('La caja ya está ocupada por otro empleado');
    }

    const usuarioExistente = await this.userRepository.findOneBy({
      email: createEmpleadoDto.email,
    });

    if (usuarioExistente) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    const hashedPassword = await bcrypt.hash(createEmpleadoDto.pwdPassword, 10);
    usuario = this.userRepository.create({
      nbNombres: createEmpleadoDto.nbNombres,
      email: createEmpleadoDto.email,
      pwdPassword: hashedPassword,
      empresa,
      role: Role.EMPLEADO,
    });

    usuario = await this.userRepository.save(usuario);
    const existingEmpleadoEmail = await this.empleadoRepository.findOne({
      where: {
        email: createEmpleadoDto.email,
        empresa: { id_empresa: empresa.id_empresa },
      },
    });

    if (existingEmpleadoEmail) {
      throw new BadRequestException('Ya existe un empleado con ese email para esta empresa');
    }
  } else {
    if (createEmpleadoDto.id_caja) {
      caja = await this.cajaRepository.findOne({
        where: {
          id_caja: createEmpleadoDto.id_caja,
          empresa: { id_empresa: user.role === Role.SOPORTE ? createEmpleadoDto.id_empresa : user.id_empresa }
        }
      });

      if (!caja) {
        throw new BadRequestException('La caja no existe');
      }
    }
  }

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

  const empleado = this.empleadoRepository.create({
    ...createEmpleadoDto,
    userEmail: user.email,
    user: usuario,
    empresa,
    perfil,
    estatus,
    role: Role.EMPLEADO,
    caja
  });

  return await this.empleadoRepository.save(empleado);
}
 
  async findAll(user: UserActiveInterface) {
   
    if (user.role === Role.SOPORTE) {
      return await this.empleadoRepository.find({
        relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
      });
    }
    return await this.empleadoRepository.find({
      where: { empresa: { id_empresa: user.id_empresa } },
      relations: ['empresa', 'user', 'perfil', 'estatus', 'caja'],
    });
  }

  //filtro de las cajas disponibles que no estan ocupando por empleados
  async findCajasDisponibles(user: UserActiveInterface){
   
      const todasLasCajas = await this.cajaRepository.find({
        where: {empresa: {
          id_empresa: user.id_empresa
        }},
        order:{
          num_caja: 'DESC'
        }
      })
      const cajasOcupadas = await this.empleadoRepository.find({
        where: {
          empresa: {id_empresa: user.id_empresa},
          caja: Not(IsNull())
        },
      
        relations: ['caja']
      })
      const idsOcupados = new Set(cajasOcupadas.map(c => c.caja.id_caja))
      const cajasDisponibles = todasLasCajas.filter(c => !idsOcupados.has(c.id_caja))
      return cajasDisponibles
    
    
  }


  async findOne(id: number, user: UserActiveInterface) {
    if (user.role === Role.SOPORTE) {
      const empleado = await this.empleadoRepository.findOne({
        where: { id_empleado: id },
        relations: ['empresa', 'user', 'perfil', 'estatus', 'caja'],
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
      relations: ['empresa', 'user', 'perfil', 'estatus', 'caja'],
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
      relations: ['empresa', 'perfil', 'estatus', 'user', 'caja'],
    });
  } else {
    empleado = await this.empleadoRepository.findOne({
      where: {
        id_empleado: id,
        empresa: { id_empresa: user.id_empresa },
      },
      relations: ['empresa', 'perfil', 'estatus', 'user', 'caja'],
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

  let nuevaCaja = null;
  if (updateEmpleadoDto.id_caja) {
    nuevaCaja = await this.cajaRepository.findOne({
      where: {
        id_caja: updateEmpleadoDto.id_caja,
        empresa: { id_empresa: empleado.empresa.id_empresa }
      }
    });

    if (!nuevaCaja) {
      throw new BadRequestException('La caja no existe');
    }

    if (!empleado.caja || empleado.caja.id_caja !== updateEmpleadoDto.id_caja) {
      const cajaOcupada = await this.empleadoRepository.findOne({
        where: {
          caja: { id_caja: updateEmpleadoDto.id_caja },
          empresa: { id_empresa: empleado.empresa.id_empresa },
          user: Not(IsNull()),
          id_empleado: Not(id)
        },
        relations: ['user', 'caja', 'empresa']
      });

      if (cajaOcupada) {
        throw new BadRequestException('La caja ya está ocupada por otro empleado');
      }
    }

    empleado.caja = nuevaCaja;
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


  if (updateEmpleadoDto.aplicaEnUsuario) {

    if (!updateEmpleadoDto.id_caja && !empleado.caja) {
      throw new BadRequestException('Se requiere asignar una caja si aplicaEnUsuario es verdadero');
    }

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
  } else {
    if (empleado.aplicaEnUsuario && updateEmpleadoDto.aplicaEnUsuario === false) {
      empleado.caja = null;
    }
  }


  const { id_perfil, id_estatus, id_caja, aplicaEnUsuario, pwdPassword, ...empleadoData } = updateEmpleadoDto;
  Object.assign(empleado, empleadoData);

  empleado.aplicaEnUsuario = aplicaEnUsuario;

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
        relations: ['empresa', 'user', 'perfil', 'estatus', 'caja'],
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
      relations: ['empresa', 'user', 'perfil', 'estatus', 'caja'],
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }
    return this.empleadoRepository.remove(empleado);
  }

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
      }, relations: ['empresa','perfil', 'estatus', 'user', 'caja']
    })
    return empleado
  }

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
      }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
    })
    return empleado
  }

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
      }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
    })
    return empleado
  }

  async findEmpleadoAplicaUsuario(user: UserActiveInterface){
    if(user.role === Role.SOPORTE){
      const empleado = await this.empleadoRepository.find({
        where:{
          aplicaEnUsuario: true
        }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
      })
      return empleado 
    }
    const empleado = await this.empleadoRepository.find({
      where:{
        empresa: {
          id_empresa: user.id_empresa
        }, 
        aplicaEnUsuario: true
      }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
    })
    return empleado
  }

  async findEmpleadoNoAplicaUsuario(user: UserActiveInterface){
    const empleado = await this.empleadoRepository.find({
      where:{
        empresa: {
          id_empresa: user.id_empresa
        }, 
        aplicaEnUsuario: false
      }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
    })
    return empleado
  }

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
      }, relations: ['empresa', 'user', 'perfil', 'estatus', 'caja']
    })
    return empleado
  }

}
