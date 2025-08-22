'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Progress } from '@/app/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Download, Upload, Database, Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';

interface BackupRecord {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: 'Manual' | 'Automatic';
  status: 'Complete' | 'In Progress' | 'Failed';
}

const mockBackups: BackupRecord[] = [
  {
    id: '1',
    name: 'library_backup_2024_08_22.sql',
    size: '45.2 MB',
    createdAt: '2024-08-22 02:00:00',
    type: 'Automatic',
    status: 'Complete'
  },
  {
    id: '2',
    name: 'manual_backup_2024_08_21.sql',
    size: '44.8 MB',
    createdAt: '2024-08-21 14:30:00',
    type: 'Manual',
    status: 'Complete'
  },
  {
    id: '3',
    name: 'library_backup_2024_08_21.sql',
    size: '44.1 MB',
    createdAt: '2024-08-21 02:00:00',
    type: 'Automatic',
    status: 'Complete'
  }
];

export default function BackupRestore() {
  const [backups, setBackups] = useState<BackupRecord[]>(mockBackups);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  const startBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          
          // Add new backup to list
          const newBackup: BackupRecord = {
            id: Date.now().toString(),
            name: `manual_backup_${new Date().toISOString().split('T')[0]}.sql`,
            size: '45.6 MB',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            type: 'Manual',
            status: 'Complete'
          };
          setBackups(prev => [newBackup, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const startRestore = async (backupId: string) => {
    setIsRestoring(true);
    setRestoreProgress(0);

    // Simulate restore progress
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRestoring(false);
          return 100;
        }
        return prev + 15;
      });
    }, 800);
  };

  const deleteBackup = (backupId: string) => {
    setBackups(prev => prev.filter(backup => backup.id !== backupId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'In Progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
        <p className="text-muted-foreground">
          Manage database backups and system recovery
        </p>
      </div>

      {/* Backup Status Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Last Backup Status</AlertTitle>
        <AlertDescription>
          Last automatic backup completed successfully on August 22, 2024 at 2:00 AM. 
          Next scheduled backup: August 23, 2024 at 2:00 AM.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Create Backup
            </CardTitle>
            <CardDescription>
              Create a manual backup of the library database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBackingUp ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Creating backup...</span>
                </div>
                <Progress value={backupProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {backupProgress}% complete
                </p>
              </div>
            ) : (
              <Button onClick={startBackup} className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Create Manual Backup
              </Button>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Automatic Backup Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-backup">Enable Automatic Backups</Label>
                  <Switch
                    id="auto-backup"
                    checked={autoBackupEnabled}
                    onCheckedChange={setAutoBackupEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restore Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore Database
            </CardTitle>
            <CardDescription>
              Restore the database from a backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRestoring ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Restoring database...</span>
                </div>
                <Progress value={restoreProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {restoreProgress}% complete
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="backup-file">Upload Backup File</Label>
                  <Input
                    id="backup-file"
                    type="file"
                    accept=".sql,.db,.backup"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Warning</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Restoring will replace all current data. Make sure to create a backup first.
                  </AlertDescription>
                </Alert>

                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={!selectedFile}
                  onClick={() => startRestore('current')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Database
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage previous database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.createdAt}</TableCell>
                  <TableCell>
                    <Badge variant={backup.type === 'Manual' ? 'default' : 'secondary'}>
                      {backup.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Restore from Backup</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to restore from this backup? This will replace all current data.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline">Cancel</Button>
                            <Button 
                              variant="destructive"
                              onClick={() => startRestore(backup.id)}
                            >
                              Restore
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteBackup(backup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system status and storage information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Database Size</span>
              </div>
              <p className="text-2xl font-bold">2.3 GB</p>
              <p className="text-sm text-muted-foreground">Current database size</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="font-medium">Backup Storage</span>
              </div>
              <p className="text-2xl font-bold">890 MB</p>
              <p className="text-sm text-muted-foreground">Total backup files size</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Available Space</span>
              </div>
              <p className="text-2xl font-bold">45.7 GB</p>
              <p className="text-sm text-muted-foreground">Free storage remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
