import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class CategoriaService {

  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ){}
  async create(createCategoriaDto: CreateCategoriaDto, user: UserActiveInterface) {
    let empresa: Empresa;
      if (user.role === Role.SOPORTE) {
        if (!createCategoriaDto.id_empresa) {
          throw new BadRequestException(
            'El id de la empresa es requerido en el perfil de soporte',
          );
        }
        empresa = await this.empresaRepository.findOne({
          where: { id_empresa: createCategoriaDto.id_empresa },
        });
      } else {
        empresa = await this.empresaRepository.findOne({
          where: { id_empresa: user.id_empresa },
        });
      }
    
      if (!empresa) {
        throw new BadRequestException('Empresa no encontrada');
      }

      const existingCategoria = await this.categoriaRepository.findOne({
        where: {
          nombre: createCategoriaDto.nombre,
          empresa: { id_empresa: user.role === Role.SOPORTE ? createCategoriaDto.id_empresa : user.id_empresa }
        }
      });

      if (existingCategoria) {
        throw new BadRequestException('Ya existe una categoria con ese nombre');
      }

      const newCategoria = this.categoriaRepository.create({
        ...createCategoriaDto,
        empresa,
        userEmail: user.email
      })

      return this.categoriaRepository.save(newCategoria);
  }

  async findAll(user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      return await this.categoriaRepository.find({
        relations: ['empresa']
      });
    }
    return await this.categoriaRepository.find({
      where: { empresa: { id_empresa: user.id_empresa } }
    });
  }

  async findOne(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const categoria = await this.categoriaRepository.findOne({
        where: { id_categoria: id },
        relations: ['empresa']
      });
      if (!categoria) {
        throw new BadRequestException('Categoria no encontrada');
      }
      return categoria;
    }
    const categoria = await this.categoriaRepository.findOne({
      where: {
        id_categoria: id,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (!categoria) {
      throw new BadRequestException('Categoria no encontrada');
    }
    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto, user: UserActiveInterface) {
    let categoria : Categoria
    if(user.role === Role.SOPORTE){
      categoria = await this.categoriaRepository.findOne({
        where: { id_categoria: id },
        relations: ['empresa']
      })
    }else {
      categoria = await this.categoriaRepository.findOne({
        where: {
          id_categoria: id,
          empresa: { id_empresa: user.id_empresa },
        },
      })
    }
    if (!categoria) {
      throw new BadRequestException('Categoria no encontrada');
    }

    //validar si ya existe una categoria con ese nombre
    const existingCategoria = await this.categoriaRepository.findOne({
      where: {
        nombre: updateCategoriaDto.nombre,
        empresa: { id_empresa: user.role === Role.SOPORTE ? updateCategoriaDto.id_empresa : user.id_empresa }
      }
    })
    if (existingCategoria && existingCategoria.id_categoria !== id) {
      throw new BadRequestException('Ya existe una categoria con ese nombre');
    }
   
    Object.assign(categoria, updateCategoriaDto)
    return await this.categoriaRepository.save(categoria)
  }

  async remove(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const categoria = await this.categoriaRepository.findOne({
        where: { id_categoria: id },
        relations: ['empresa']
      })
      if (!categoria) {
        throw new BadRequestException('Categoria no encontrada');
      }
      return await this.categoriaRepository.delete(id)
    }
    const categoria = await this.categoriaRepository.findOne({
      where: {
        id_categoria: id,
        empresa: { id_empresa: user.id_empresa },
      },
    })
    if (!categoria) {
      throw new BadRequestException('Categoria no encontrada');
    }
    return await this.categoriaRepository.remove(categoria)
  }
}
