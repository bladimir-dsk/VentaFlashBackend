import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UnidadMedida } from '../../unidad-medida/entities/unidad-medida.entity';

@Entity()
export class UnidadConversione {
  @PrimaryGeneratedColumn()
  id_unidadConversion: number;

  // Definimos el factor como decimal (número)
  @Column({ type: 'decimal', precision: 10, scale: 6 })
  factor: number;

  // Relación Many-to-One con UnidadMedida (fromUnit)
  @ManyToOne(() => UnidadMedida, { eager: true })
  @JoinColumn({ name: 'fromUnitId' })
  fromUnit: UnidadMedida;

  // Relación Many-to-One con UnidadMedida (toUnit)
  @ManyToOne(() => UnidadMedida, { eager: true })
  @JoinColumn({ name: 'toUnitId' })
  toUnit: UnidadMedida;
}