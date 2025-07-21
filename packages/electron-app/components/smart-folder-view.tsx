"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { FileItem, SmartFolder } from "@/app/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface SmartFolderViewProps {
  folder: SmartFolder;
  onBack: () => void;
  onFileSelect: (file: FileItem) => void;
}

export function SmartFolderView({ folder, onBack, onFileSelect }: SmartFolderViewProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!folder) return;
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_smart_folder_files', {
        p_folder_id: folder.id,
      });

      if (error) {
        console.error("Error fetching files for smart folder:", error);
      } else {
        setFiles(data);
      }
      setIsLoading(false);
    };

    fetchFiles();
  }, [folder]);

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{folder.name}</h1>
          <p className="text-muted-foreground">{folder.description}</p>
        </div>
      </div>

      {isLoading ? (
        <p>Loading files...</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="cursor-pointer hover:shadow-md" onClick={() => window.electron.openFile(file.filepath)}>
              <CardContent className="p-3 flex items-center">
                <FileText className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-semibold">{file.filename}</p>
                  <p className="text-sm text-muted-foreground">{file.filepath}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
