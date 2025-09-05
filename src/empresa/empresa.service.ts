import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/common/enums/rol.enum';
import { PagosService } from 'src/pagos/pagos.service'; // Importar el servicio de pagos
import { Pago } from 'src/pagos/entities/pago.entity';
import e from 'express';
import * as fs from 'fs';
import { extname } from 'path';
import { RenovacionPagoDto } from 'src/pagos/dto/create-renovacion.dto';
import * as path from 'path';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly pagosService: PagosService, // Inyectar el servicio de pagos
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto, userId: number) {
    // aqui estoy usando el servicio de pagos para generar uno nuevo
    const pagoResult = await this.pagosService.create(
      {
        id_planVigencia: createEmpresaDto.id_planVigencia,
      },
      userId, // pasamos el id del usuario que está creando la empresa
      createEmpresaDto.nombre, // Guardamos el nombre de la empresa
      createEmpresaDto.rfc
    );

    // aqui le retornamos la url de pago antes de guardar la empresa
    return { url: pagoResult.paymentUrl };
  }
  async guardarEmpresaSiNoExiste(pagoId: number) {
    const pago = await this.pagoRepository.findOne({
      where: { id_pago: pagoId },
      relations: ['empresa']
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }

    // Solo crear empresa si no existe
    if (!pago.empresa) {
      const empresa = this.empresaRepository.create({
        ...pago.empresa,
        Pago: { id_pago: pagoId }
      });
      await this.empresaRepository.save(empresa);
    }
  }

  async guardarEmpresaDespuesDePago(pagoId: number) {
    // en esta busqueda buscamos el pago con el id y que este confirmado
    const pago = await this.pagoRepository.findOne({
      where: { id_pago: pagoId, estado: true },
      relations: ['usuario'], // iniciamos la relacion con el usuario que realizo el pago
    });

    if (!pago) {
      throw new BadRequestException('El pago no ha sido confirmado');
    }

    // 2️⃣ Crear la empresa en la base de datos
    const empresa = this.empresaRepository.create({
      nombre: pago.nombre_empresa,
      Pago: { id_pago: pagoId },
      rfc: pago.rfc_empresa
    });

    const empresaGuardada = await this.empresaRepository.save(empresa);

    // al usuario del pago le metemos la empresa que se creo
    if (pago.usuario) {
      await this.userRepository.update(pago.usuario.id, {
        empresa: empresaGuardada, // asignamos la empresa al usuario
      });
    }

    return empresaGuardada;
  }

  async findAll(user: UserActiveInterface, renovacionDto?: RenovacionPagoDto) {
    if (user.role === Role.SOPORTE) {
      return this.empresaRepository.find({
        relations: [
          'Pago',
          'Pago.planVigencia',
          'Pago.planVigencia.plan',
          'Pago.planVigencia.plan.modulo',
          'Pago.usuario',
        ],
      });
    }
    await this.checkFechaExp(user, renovacionDto);
    return this.empresaRepository.find({
      where: { id_empresa: user.id_empresa },
      relations: [
        'Pago',
        'Pago.planVigencia',
        'Pago.planVigencia.plan',
        'Pago.planVigencia.plan.modulo',
      ],
    });
  }

  async findAllEmpresa(user: UserActiveInterface, renovacionDto?: RenovacionPagoDto) {
    if (user.role === Role.SOPORTE) {
      return this.empresaRepository.find({
        relations: [
          'Pago',
          'Pago.planVigencia',
          'Pago.planVigencia.plan',
          'Pago.planVigencia.plan.modulo',
          'Pago.usuario',
        ],
      });
    }
    
    const empresa = await this.empresaRepository.find({
      where: { id_empresa: user.id_empresa },
      relations: [
        'Pago',
        'Pago.planVigencia',
        'Pago.planVigencia.plan',
        'Pago.planVigencia.plan.modulo',
      ],
    });
    return {
      empresa, 
      estado: true
    }
  }
  

  async findOne(id: number) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: id },
      relations: [
        'Pago',
        'Pago.planVigencia',
        'Pago.planVigencia.plan',
        'Pago.planVigencia.plan.modulo',
        'Pago.usuario',
      ],
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    return empresa;
  }
  //  private deleteFileIfExists(file?: Express.Multer.File) {
  //     if (file?.path) {
  //       if (fs.existsSync(file.path)) {
  //         fs.unlinkSync(file.path);
  //       }
  //     }
  //   }
  

  async update(
    id: number,
    updateEmpresaDto: UpdateEmpresaDto,
    user: UserActiveInterface,
    foto?: Express.Multer.File,
  ) {
    const usuario = await this.userRepository.findOne({
      where: { email: user.email },
      relations: ['empresa'],
    });
  
    if (!usuario) {
      this.deleteFileIfExists(foto);
      throw new BadRequestException('Usuario no encontrado');
    }
  
    // Validación de permisos
    if (user.role !== Role.SOPORTE) {
      if (!usuario.empresa) {
        this.deleteFileIfExists(foto);
        throw new BadRequestException('No tienes una empresa asociada');
      }
  
      if (usuario.empresa.id_empresa !== id) {
        this.deleteFileIfExists(foto);
        throw new BadRequestException('No tienes permiso para actualizar esta empresa');
      }
    }
  
    // Obtener la empresa actual
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: id },
    });
  
    if (!empresa) {
      this.deleteFileIfExists(foto);
      throw new BadRequestException('Empresa no encontrada');
    }
  
    // Manejo de la imagen de perfil
    let pathFotoPerfil = empresa.path_foto_perfil;
  
    if (foto) {
      const empresaFolder = `./uploads/logo/${id}_${empresa.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      
      // Crear carpeta si no existe
      if (!fs.existsSync(empresaFolder)) {
        fs.mkdirSync(empresaFolder, { recursive: true });
      }
  
      // ✅ SOLUCIÓN: Eliminar TODOS los archivos que empiecen con "perfil" en la carpeta
      if (fs.existsSync(empresaFolder)) {
        const files = fs.readdirSync(empresaFolder);
        files.forEach(file => {
          if (file.startsWith('perfil')) {
            const filePath = path.join(empresaFolder, file);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
      }
  
      // Mover la nueva imagen a la carpeta definitiva
      const tempPath = foto.path;
      const finalFileName = `perfil${extname(foto.originalname)}`;
      const finalFilePath = `${empresaFolder}/${finalFileName}`;
  
      fs.renameSync(tempPath, finalFilePath);
      
      // ✅ Actualizar la ruta relativa correctamente
      pathFotoPerfil = `${id}_${empresa.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/${finalFileName}`;
    }
  
    // Actualizar los datos de la empresa
    await this.empresaRepository.update(id, {
      ...updateEmpresaDto,
      path_foto_perfil: pathFotoPerfil,
    });
  
    return this.empresaRepository.findOne({
      where: { id_empresa: id },
      relations: [
        'Pago',
        'Pago.planVigencia',
        'Pago.planVigencia.plan',
        'Pago.planVigencia.plan.modulo',
      ],
    });
  }
  
  private deleteFileIfExists(file?: Express.Multer.File) {
    if (file?.path) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  remove(id: number) {
    return `This action removes a #${id} empresa`;
  }

  async getHistorialPagos(
    idEmpresa: number,
    user: UserActiveInterface,
    filters?: { estado?: boolean; desde?: Date; hasta?: Date },
  ) {
    // Verificar permisos
    if (user.role !== Role.SOPORTE && user.id_empresa !== idEmpresa) {
      throw new BadRequestException(
        'No tienes permiso para ver este historial',
      );
    }

    // Obtener la empresa con su pago actual
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: idEmpresa },
      relations: ['Pago'],
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    const query = this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoinAndSelect('pago.planVigencia', 'planVigencia')
      .leftJoinAndSelect('planVigencia.plan', 'plan')
      .leftJoinAndSelect('plan.modulo', 'modulo')
      .where('pago.nombre_empresa = :nombre', { nombre: empresa.nombre })
      .orderBy('pago.fecha_pago', 'DESC');

    if (filters?.estado !== undefined) {
      query.andWhere('pago.estado = :estado', { estado: filters.estado });
    }

    if (filters?.desde) {
      query.andWhere('pago.fecha_pago >= :desde', { desde: filters.desde });
    }

    if (filters?.hasta) {
      query.andWhere('pago.fecha_pago <= :hasta', { hasta: filters.hasta });
    }

    return query.getMany();
  }
  //historial de pagos para soporte
  async getHistorialPagosSoporte(
    idEmpresa: number,
    user: UserActiveInterface,
    filters?: { estado?: boolean; desde?: Date; hasta?: Date },
  ) {
    
    if(user.role !== Role.SOPORTE) {
      throw new BadRequestException('Solo soporte puede filtrar empresas');
    }

    // Obtener la empresa con su pago actual
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: idEmpresa },
      relations: ['Pago'],
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    const query = this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoinAndSelect('pago.planVigencia', 'planVigencia')
      .leftJoinAndSelect('planVigencia.plan', 'plan')
      .leftJoinAndSelect('plan.modulo', 'modulo')
      .where('pago.nombre_empresa = :nombre', { nombre: empresa.nombre })
      .orderBy('pago.fecha_pago', 'DESC');

    if (filters?.estado !== undefined) {
      query.andWhere('pago.estado = :estado', { estado: filters.estado });
    }

    if (filters?.desde) {
      query.andWhere('pago.fecha_pago >= :desde', { desde: filters.desde });
    }

    if (filters?.hasta) {
      query.andWhere('pago.fecha_pago <= :hasta', { hasta: filters.hasta });
    }

    return query.getMany();
  }

  //si fecha_expiracion vence, no puedes realizar ninguna accion
  async checkFechaExp(user: UserActiveInterface, renovacionDto?: RenovacionPagoDto) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
      relations: ['Pago'],
    });
  
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
  
    const pago = empresa.Pago;
  
    // Si el pago ha vencido
    if (pago?.fecha_expiracion && new Date(pago.fecha_expiracion) < new Date()) {
      
      // Si es un EMPLEADO no puede hacer nada
      if (user.role === Role.EMPLEADO) {
        throw new BadRequestException({
          mensaje: 'No puedes realizar ninguna acción. La empresa ha caducado y debe renovar el plan.',
          renovar: false,
          acceso_denegado: true,
        });
      }
  
      // Si es una EMPRESA, puede renovar
      if (user.role === Role.EMPRESA) {
        const resultadoRenovacion = await this.pagosService.verificarYRenovarPago(user, renovacionDto);
  
        if (!resultadoRenovacion.paid) {
          throw new BadRequestException({
            mensaje: 'La empresa ha caducado. Es necesario renovar para continuar.',
            renovar: true,
            link_pago: resultadoRenovacion.paymentUrl,
            fecha_expiracion: resultadoRenovacion.fecha_expiracion,
            plan: resultadoRenovacion.plan,
          });
        }
      }
    }
  
    return empresa;
  }

  
}
