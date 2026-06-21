import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Medication } from '../../../core/models/medication.model';

@Component({
  selector: 'app-doctor-medications',
  imports: [FormsModule],
  templateUrl: './medications.html',
})
export class Medications implements OnInit {
  private api = inject(ApiService);

  meds = signal<Medication[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // Add/edit modal
  modalOpen = signal(false);
  modalSaving = signal(false);
  modalError = signal('');
  editingId = signal<string | null>(null);

  form = { name: '', dosage: '', frequency: '', duration: '', instructions: '', description: '' };

  // Delete modal
  deleteOpen = signal(false);
  deleteSaving = signal(false);
  deleteError = signal('');
  deleteTarget = signal<Medication | null>(null);

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.meds.set(await this.api.get<Medication[]>('/medications'));
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form = { name: '', dosage: '', frequency: '', duration: '', instructions: '', description: '' };
    this.modalError.set('');
    this.modalOpen.set(true);
  }

  openEdit(m: Medication): void {
    this.editingId.set(m._id);
    this.form = {
      name: m.medication_name || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      instructions: m.instructions || '',
      description: m.description || '',
    };
    this.modalError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    const body = {
      medication_name: this.form.name.trim(),
      dosage: this.form.dosage.trim(),
      frequency: this.form.frequency.trim(),
      duration: this.form.duration.trim(),
      instructions: this.form.instructions.trim(),
      description: this.form.description.trim(),
    };
    if (!body.medication_name || !body.dosage) {
      this.modalError.set('Name and dosage are required.');
      return;
    }
    this.modalSaving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await this.api.patch(`/medications/${id}`, body);
      } else {
        await this.api.post('/medications', body);
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.modalError.set((e as Error).message);
    } finally {
      this.modalSaving.set(false);
    }
  }

  openDelete(m: Medication): void {
    this.deleteTarget.set(m);
    this.deleteError.set('');
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteSaving.set(true);
    try {
      await this.api.delete(`/medications/${target._id}`);
      this.closeDelete();
      await this.load();
    } catch (e) {
      this.deleteError.set((e as Error).message);
    } finally {
      this.deleteSaving.set(false);
    }
  }
}
