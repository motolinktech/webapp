import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { AlertCircle, ExternalLink, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { FileUploader } from "@/components/ui/file-uploader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { VEHICLE_TYPES } from "@/lib/constants/vehicle-type";
import { VEHICLE_COLORS } from "@/lib/constants/colors";
import { cpfMask } from "@/lib/masks/cpf-mask";
import { phoneMask } from "@/lib/masks/phone-mask";
import { storage } from "@/lib/services/firebase.service";
import { cpfValidator } from "@/lib/utils/cpf-validator";
import { createDeliveryman, updateDeliveryman } from "@/modules/deliverymen/deliverymen.service";
import type { Deliveryman } from "@/modules/deliverymen/deliverymen.types";
import { listRegions } from "@/modules/regions/regions.service";

const deliverymanFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  document: z.string().length(14, "CPF inválido, deve ter 11 dígitos (XXX.XXX.XXX-XX)")
    .superRefine((val, ctx) => {
      try {
        cpfValidator(val);
      } catch (err) {
        ctx.addIssue({ code: 'custom', message: (err as Error).message });
      }
    }),
  phone: z.string().min(14, "Telefone inválido (ex: (DD) XXXXX-XXXX)"),
  contractType: z.enum(["FREELANCER", "INDEPENDENT_COLLABORATOR"], {
    message: "Selecione um tipo de contrato",
  }),
  mainPixKey: z.string().min(1, "Chave PIX principal é obrigatória"),
  secondPixKey: z.string().optional(),
  thridPixKey: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  regionId: z.string().optional(),
  documents: z.any().optional(),
  files: z.array(z.string()).optional(),
});

type DeliverymanFormData = z.infer<typeof deliverymanFormSchema>;

interface DeliverymenFormProps {
  deliveryman?: Deliveryman | null;
}

export function DeliverymenForm({ deliveryman }: DeliverymenFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<DeliverymanFormData>({
    resolver: zodResolver(deliverymanFormSchema),
    defaultValues: {
      name: deliveryman?.name || "",
      document: deliveryman?.document ? cpfMask(deliveryman.document) : "",
      phone: deliveryman?.phone ? phoneMask(deliveryman.phone) : "",
      contractType:
        (deliveryman?.contractType as "FREELANCER" | "INDEPENDENT_COLLABORATOR") || undefined,
      mainPixKey: deliveryman?.mainPixKey || "",
      secondPixKey: deliveryman?.secondPixKey || "",
      thridPixKey: deliveryman?.thridPixKey || "",
      agency: deliveryman?.agency || "",
      account: deliveryman?.account || "",
      vehicleModel: deliveryman?.vehicleModel || "",
      vehiclePlate: deliveryman?.vehiclePlate || "",
      vehicleColor: deliveryman?.vehicleColor || "",
      regionId: deliveryman?.regionId || undefined,
      documents: deliveryman?.files || [],
    },
  });
  const queryClient = useQueryClient();

  const [existingFiles, setExistingFiles] = useState<string[]>(deliveryman?.files || []);

  const mainPixKey = useWatch({ control, name: "mainPixKey" });
  const secondPixKey = useWatch({ control, name: "secondPixKey" });

  const { data: regionsData } = useQuery({
    queryKey: ["regions"],
    queryFn: () => listRegions({ limit: 1000 }),
  });

  const clearMasks = (data: DeliverymanFormData) => {
    return {
      ...data,
      document: data.document.replace(/\D/g, ""),
      phone: data.phone.replace(/\D/g, ""),
    };
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/[^/]+(?=\?|$)/);
      if (matches) {
        const fullName = matches[0];
        const nameParts = fullName.split("-");
        return nameParts.length > 1 ? nameParts.slice(1).join("-") : fullName;
      }
      return "Documento";
    } catch {
      return "Documento";
    }
  };

  const { mutateAsync, isError, isPending } = useMutation({
    mutationFn: async (data: DeliverymanFormData) => {
      const unmaskedData = clearMasks(data);

      let newUploadedFiles: string[] = [];
      if (data.documents && data.documents.length > 0) {
        newUploadedFiles = await Promise.all(
          data.documents.map(async (file: File) => {
            const storageRef = ref(storage, `deliverymen-documents/${crypto.randomUUID()}-${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            return downloadUrl;
          }),
        );
      }

      const allFiles = [...existingFiles, ...newUploadedFiles];
      if (allFiles.length > 0) {
        unmaskedData.files = allFiles;
      }

      if (deliveryman?.id) {
        return updateDeliveryman({ id: deliveryman.id, ...unmaskedData });
      }

      return createDeliveryman(unmaskedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      navigate({ to: "/gestao/entregadores" });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutateAsync(data))}
      className="p-4 overflow-y-auto h-full"
    >
      <FieldGroup className="flex flex-col gap-4">
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Erro ao salvar entregador</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend>Informação Pessoal</FieldLegend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="document">CPF</FieldLabel>
              <Input
                id="document"
                {...register("document", {
                  onChange: (e) => {
                    e.target.value = cpfMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.document]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Telefone</FieldLabel>
              <Input
                id="phone"
                {...register("phone", {
                  onChange: (e) => {
                    e.target.value = phoneMask(e.target.value);
                  },
                })}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
            <Controller
              control={control}
              name="contractType"
              render={({ field }) => (
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="contractType">Tipo de Contrato</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREELANCER">FREELANCER</SelectItem>
                      <SelectItem value="INDEPENDENT_COLLABORATOR">
                        COLABORADOR INDEPENDENTE
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.contractType]} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="documents"
              render={({ field }) => (
                <Field className="md:col-span-2">
                  <FieldLabel>Documentos</FieldLabel>
                  <FileUploader
                    value={field.value}
                    onChange={field.onChange}
                    multiple
                    accept={{
                      "application/pdf": [".pdf"],
                      "image/*": [".png", ".jpg", ".jpeg"],
                    }}
                  />
                  {existingFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Arquivos existentes
                      </p>
                      <ul className="space-y-2">
                        {existingFiles.map((fileUrl, index) => (
                          <li
                            key={fileUrl}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="size-5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm font-medium">
                                {getFileNameFromUrl(fileUrl)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                <ExternalLink className="size-4" />
                                <span className="sr-only">Abrir arquivo</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => removeExistingFile(index)}
                                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Remover arquivo</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Field>
              )}
            />
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Dados Bancários</FieldLegend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="mainPixKey">Chave PIX Principal</FieldLabel>
              <Input id="mainPixKey" {...register("mainPixKey")} />
              <FieldError errors={[errors.mainPixKey]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="secondPixKey">Chave PIX Secundária</FieldLabel>
              <Input id="secondPixKey" {...register("secondPixKey")} disabled={!mainPixKey} />
              <FieldError errors={[errors.secondPixKey]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="thridPixKey">Chave PIX Terciária</FieldLabel>
              <Input id="thridPixKey" {...register("thridPixKey")} disabled={!secondPixKey} />
              <FieldError errors={[errors.thridPixKey]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="account">Conta</FieldLabel>
              <Input id="account" {...register("account")} />
              <FieldError errors={[errors.account]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="agency">Agência</FieldLabel>
              <Input id="agency" {...register("agency")} />
              <FieldError errors={[errors.agency]} />
            </Field>
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Informações do Veículo</FieldLegend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Controller
              control={control}
              name="vehicleModel"
              render={({ field }) => (
                <Field className="md:col-span-1">
                  <FieldLabel htmlFor="vehicleModel">Modelo</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo do veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((vt) => (
                        <SelectItem key={vt} value={vt}>
                          {vt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.vehicleModel]} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="vehicleColor"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="vehicleColor">Cor</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor do veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.vehicleColor]} />
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="vehiclePlate">Placa</FieldLabel>
              <Input id="vehiclePlate" {...register("vehiclePlate")} />
              <FieldError errors={[errors.vehiclePlate]} />
            </Field>
          </div>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Associações</FieldLegend>
          <Controller
            control={control}
            name="regionId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="regionId">Região</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionsData?.data.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.regionId]} />
              </Field>
            )}
          />
        </FieldSet>

        <Button type="submit" isLoading={isPending} className="mt-4">
          {deliveryman?.id ? "Atualizar Entregador" : "Criar Entregador"}
        </Button>
      </FieldGroup>
    </form>
  );
}
