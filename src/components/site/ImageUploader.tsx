import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, deleteImageByUrl, validateImageFile } from "@/lib/storage";

interface BaseProps {
  folder: string; // e.g. "buildings/<id>" or "amenities/<id>"
  label?: string;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function ImageUploader(props: MultiProps | SingleProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { folder, label } = props;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      const err = validateImageFile(f);
      if (err) {
        toast.error(`${f.name}: ${err}`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of valid) uploaded.push(await uploadImage(folder, f));
      if (props.multiple) {
        props.onChange([...(props.value ?? []), ...uploaded]);
      } else {
        // single — replace; delete previous in background
        if (props.value) await deleteImageByUrl(props.value);
        props.onChange(uploaded[0]);
      }
    } catch (e) {
      toast.error((e as Error).message || "Error al subir imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = async (url: string) => {
    if (props.multiple) {
      props.onChange(props.value.filter((u) => u !== url));
    } else {
      props.onChange(undefined);
    }
    await deleteImageByUrl(url);
  };

  const images = props.multiple ? props.value : props.value ? [props.value] : [];

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!!props.multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(url)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                aria-label="Quitar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo…
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {props.multiple ? "Subir imágenes" : images.length > 0 ? "Cambiar imagen" : "Subir imagen"}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">JPG / PNG / WEBP · máx 5MB por archivo</p>
    </div>
  );
}

// Re-export for convenience in case consumers want preview prior to upload (not used now)
export const _noop = () => useEffect;
