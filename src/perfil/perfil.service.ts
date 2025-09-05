import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from './entities/perfil.entity';
import { Repository } from 'typeorm';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    @InjectRepository(Modulo)
    private readonly moduloRepository: Repository<Modulo>,
    @InjectRepository(Empresa) private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createPerfilDto: CreatePerfilDto, user: UserActiveInterface) {
    const modulo = await this.moduloRepository.findByIds(createPerfilDto.moduloIds);
    if (modulo.length !== createPerfilDto.moduloIds.length) {
      throw new BadRequestException('El modulo no existe');
    }
    //apartado que valida si el soporte va a insertar un dato le debe pasar
    //el id de la empresa esto le da el permiso de insertar datos en la db
    let empresa: Empresa;
    if(user.role === Role.SOPORTE){
      if(!createPerfilDto.id_empresa){
        throw new BadRequestException('El id de la empresa es requerido en el perfil de soporte');
      }
      empresa = await this.empresaRepository.findOne({ where: { id_empresa: createPerfilDto.id_empresa } });
    }
    else{
      empresa = await this.empresaRepository.findOne({ where: { id_empresa: user.id_empresa } });
    }
   
    if (!empresa) {
        throw new BadRequestException('Empresa no encontrada');
    }

    const existingPerfil = await this.perfilRepository.findOne({
      where: { nb_perfil: createPerfilDto.nb_perfil, empresa: { id_empresa: empresa.id_empresa } },
    });
    if (existingPerfil) {
      throw new BadRequestException('Ya existe un perfil con ese nombre para esta empresa');
    }

    const newPerfil = this.perfilRepository.create({...createPerfilDto, modulo: modulo, userEmail: user.email, empresa: empresa});
    return this.perfilRepository.save(newPerfil);

  }

  async findAll(user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      return await this.perfilRepository.find({ relations: ['modulo', 'empresa'] });
    }
    return await this.perfilRepository.find({ relations: ['modulo', 'empresa'], where:{
      empresa: {id_empresa: user.id_empresa}
    } });
  }

  async findOne(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const perfil = await this.perfilRepository.findOne({
        where: { id_perfil: id },
        relations: ['modulo', 'empresa'],
      });
      if (!perfil) {
        throw new BadRequestException('El perfil no existe');
      }
      return perfil;
    }
    const perfil = await this.perfilRepository.findOne({
      where: { id_perfil: id, empresa: {id_empresa: user.id_empresa}},
      relations: ['modulo', 'empresa'],
    });
    if (!perfil) {
      throw new BadRequestException('El perfil no existe');
    }
    return perfil;
  }

  async update(id: number, updatePerfilDto: UpdatePerfilDto, user: UserActiveInterface) {
    // Buscar el perfil a actualizar
    let perfil: Perfil;
  
    if (user.role === Role.SOPORTE) {
      // SOPORTE puede actualizar cualquier perfil
      perfil = await this.perfilRepository.findOne({
        where: { id_perfil: id },
        relations: ['modulo', 'empresa'], // Cargar relaciones necesarias
      });
    } else {
      // EMPRESA solo puede actualizar sus propios perfiles
      perfil = await this.perfilRepository.findOne({
        where: {
          id_perfil: id,
          empresa: { id_empresa: user.id_empresa },
        },
        relations: ['modulo', 'empresa'], // Cargar relaciones necesarias
      });
    }
  
    if (!perfil) {
      throw new BadRequestException('El perfil no existe');
    }
  
    // Validar los módulos
    if (updatePerfilDto.moduloIds) {
      const modulo = await this.moduloRepository.findByIds(updatePerfilDto.moduloIds);
      if (modulo.length !== updatePerfilDto.moduloIds.length) {
        throw new BadRequestException('Uno o más módulos no existen');
      }
      perfil.modulo = modulo; // Actualizar la relación con los módulos
    }

    if (updatePerfilDto.nb_perfil && updatePerfilDto.nb_perfil !== perfil.nb_perfil) {
      const existingPerfil = await this.perfilRepository.findOne({
        where: {
          nb_perfil: updatePerfilDto.nb_perfil,
          empresa: { id_empresa: perfil.empresa.id_empresa },
        },
      });
  
      if (existingPerfil && existingPerfil.id_perfil !== id) {
        throw new BadRequestException('Ya existe un perfil con ese nombre para esta empresa');
      }
  
      perfil.nb_perfil = updatePerfilDto.nb_perfil;
    }
  
    // Actualizar los campos del perfil (excepto moduloIds, que ya se manejó)
    const { moduloIds, nb_perfil, ...perfilData } = updatePerfilDto;
    Object.assign(perfil, perfilData);
  
    // Guardar los cambios en la base de datos
    return this.perfilRepository.save(perfil);
  }

  async remove(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const perfil = await this.perfilRepository.findOne({
        where: {
          id_perfil: id,
        }
      })
      if (!perfil) {
        throw new BadRequestException('El perfil no existe');
      }
      return this.perfilRepository.delete(id);
    }
    const perfil = await this.perfilRepository.findOne({
      where: {
        id_perfil: id, empresa: {
          id_empresa: user.id_empresa,
        }
      }
    });
    if (!perfil) {
      throw new BadRequestException('El perfil no existe');
    }
    return this.perfilRepository.delete(id);
  }

  //filtrar perfil por soporte de id de la empresa
  async findAllPerfilEmpresa (id_empresa: number, user: UserActiveInterface) {
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('No tiene permisos para realizar esta accion')
    }
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: id_empresa
      }
    })

    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }

    const perfiles = await this.perfilRepository.find({
      where: {
        empresa: {
          id_empresa: empresa.id_empresa
        }
      }, relations: ['empresa']
    })

    return perfiles

  }


}
