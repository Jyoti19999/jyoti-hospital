import React from 'react';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

const SurgeryDetailsModal = ({ 
  surgery, 
  isOpen, 
  onClose, 
  getInvestigationName 
}) => {
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    return Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  };

  if (!surgery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-semibold">
            Surgery Details - {surgery.patient?.firstName} {surgery.patient?.lastName}
          </DialogTitle>
        </DialogHeader>
        
        {/* Super Compact Two-Column Table Layout */}
        <div className="p-4">
          <Table className="text-sm">
            <TableBody>
              {/* Patient Information */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Patient Information
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3 w-1/4">Full Name</TableCell>
                <TableCell className="py-2 px-3 w-1/4">{surgery.patient?.firstName} {surgery.patient?.lastName}</TableCell>
                <TableCell className="font-medium py-2 px-3 w-1/4">Patient Number</TableCell>
                <TableCell className="py-2 px-3 w-1/4 font-mono text-xs">{surgery.patient?.patientNumber}</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Phone</TableCell>
                <TableCell className="py-2 px-3">{surgery.patient?.phone || 'N/A'}</TableCell>
                <TableCell className="font-medium py-2 px-3">Email</TableCell>
                <TableCell className="py-2 px-3">{surgery.patient?.email || 'N/A'}</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Age</TableCell>
                <TableCell className="py-2 px-3">{calculateAge(surgery.patient?.dateOfBirth)} years</TableCell>
                <TableCell className="font-medium py-2 px-3">Gender</TableCell>
                <TableCell className="py-2 px-3">{surgery.patient?.gender || 'N/A'}</TableCell>
              </TableRow>

              {/* Surgery Details */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Surgery Details
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Surgery Type</TableCell>
                <TableCell className="py-2 px-3">{surgery.surgeryTypeDetail?.name || 'Not specified'}</TableCell>
                <TableCell className="font-medium py-2 px-3">Category</TableCell>
                <TableCell className="py-2 px-3">{surgery.surgeryTypeDetail?.category || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Surgery Date</TableCell>
                <TableCell className="py-2 px-3 font-medium">{surgery.surgeryDate ? format(new Date(surgery.surgeryDate), 'dd MMM yyyy') : 'Not scheduled'}</TableCell>
                <TableCell className="font-medium py-2 px-3">Surgery Time</TableCell>
                <TableCell className="py-2 px-3">{surgery.tentativeTime || 'Not scheduled'}</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Priority</TableCell>
                <TableCell className="py-2 px-3">{surgery.priority || surgery.priorityLevel || 'Not specified'}</TableCell>
                <TableCell className="font-medium py-2 px-3">Status</TableCell>
                <TableCell className="py-2 px-3">
                  <Badge variant="outline" className="text-xs">
                    {surgery.status || 'Pending'}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Surgery Package</TableCell>
                <TableCell colSpan={3} className="py-2 px-3">
                  {surgery.surgeryPackageDetail?.packageName || surgery.surgeryPackage ? (
                    <div>
                      <div className="font-medium">
                        {surgery.surgeryPackageDetail?.packageName || surgery.surgeryPackage}
                      </div>
                      {surgery.surgeryPackageDetail?.packageCost && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Package Cost: ₹{surgery.surgeryPackageDetail.packageCost.toLocaleString()}
                        </div>
                      )}
                      {surgery.surgeryPackageDetail?.description && (
                        <div className="text-xs text-gray-600 mt-1">{surgery.surgeryPackageDetail.description}</div>
                      )}
                    </div>
                  ) : surgery.surgeryPackageId ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">Package selected but details not loaded</span>
                    </div>
                  ) : (
                    'Package not selected'
                  )}
                </TableCell>
              </TableRow>

              {/* Admission Details */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Admission Details
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Admission Number</TableCell>
                <TableCell className="py-2 px-3 font-mono text-xs">{surgery.admissionNumber}</TableCell>
                <TableCell className="font-medium py-2 px-3">Admission Date</TableCell>
                <TableCell className="py-2 px-3 font-medium">{format(new Date(surgery.admissionDate), 'dd MMM yyyy')}</TableCell>
              </TableRow>

              {/* Lens Information */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Lens Information
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Lens Required</TableCell>
                <TableCell className="py-2 px-3">
                  <Badge className={`text-xs ${surgery.lensRequired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {surgery.lensRequired ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium py-2 px-3">IOL Type</TableCell>
                <TableCell className="py-2 px-3">{surgery.iolType || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Eye</TableCell>
                <TableCell className="py-2 px-3 font-medium">{surgery.eye || 'Not specified'}</TableCell>
                <TableCell className="font-medium py-2 px-3">Lens Name</TableCell>
                <TableCell className="py-2 px-3">{surgery.lens?.lensName || 'N/A'}</TableCell>
              </TableRow>
              {surgery.lens && (
                <>
                  <TableRow className="border-b border-gray-100">
                    <TableCell className="font-medium py-2 px-3">Manufacturer</TableCell>
                    <TableCell className="py-2 px-3">{surgery.lens.manufacturer}</TableCell>
                    <TableCell className="font-medium py-2 px-3">Type</TableCell>
                    <TableCell className="py-2 px-3">{surgery.lens.lensType || 'Not specified'}</TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-100">
                    <TableCell className="font-medium py-2 px-3">Patient Cost</TableCell>
                    <TableCell className="py-2 px-3 font-medium">
                      {surgery.lens.patientCost ? `₹${surgery.lens.patientCost.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium py-2 px-3">Hospital Cost</TableCell>
                    <TableCell className="py-2 px-3 font-medium">
                      {surgery.lens.hospitalCost ? `₹${surgery.lens.hospitalCost.toLocaleString()}` : 'N/A'}
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Medical Team */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Medical Team
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Surgeon</TableCell>
                <TableCell className="py-2 px-3">
                  {surgery.surgeon ? `Dr. ${surgery.surgeon.firstName} ${surgery.surgeon.lastName}` : 'Not assigned'}
                </TableCell>
                <TableCell className="font-medium py-2 px-3">Anesthesiologist</TableCell>
                <TableCell className="py-2 px-3">
                  {surgery.anesthesiologist ? `Dr. ${surgery.anesthesiologist.firstName} ${surgery.anesthesiologist.lastName}` : 'Not assigned'}
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Sister/Nurse</TableCell>
                <TableCell colSpan={3} className="py-2 px-3">
                  {surgery.sister ? `${surgery.sister.firstName} ${surgery.sister.lastName}` : 'Not assigned'}
                </TableCell>
              </TableRow>

              {/* Required Investigations */}
              {surgery.surgeryTypeDetail?.investigationIds?.length > 0 ? (
                <>
                  <TableRow className="border-b">
                    <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                      Required Investigations
                    </TableCell>
                  </TableRow>
                  {surgery.surgeryTypeDetail.investigationIds.map((investigationId, index) => {
                    const investigationName = getInvestigationName ? getInvestigationName(investigationId) : investigationId;
                    const isNameResolved = investigationName !== investigationId;
                    
                    return (
                      <TableRow key={index} className="border-b border-gray-100">
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <div>
                              <span className="text-sm font-medium">
                                {isNameResolved ? investigationName : `Investigation ${index + 1}`}
                              </span>
                              {!isNameResolved && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {investigationId}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge variant="outline" className="text-xs text-red-700 border-red-200">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell colSpan={2} className="py-2 px-3 text-gray-600">To be completed before surgery</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="border-b border-gray-100">
                    <TableCell colSpan={4} className="py-2 px-3 text-xs text-gray-600">
                      <strong>Note:</strong> All investigations must be completed before surgery can proceed.
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <>
                  <TableRow className="border-b">
                    <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                      Required Investigations
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b border-gray-100">
                    <TableCell colSpan={4} className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700 font-medium">No specific investigations required</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Claim & Payment Information */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  Claim & Payment Information
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Final Surgery Amount</TableCell>
                <TableCell className="py-2 px-3 font-medium text-green-700">
                  {surgery.finalSurgeryAmount ? `₹${surgery.finalSurgeryAmount.toLocaleString()}` : 'Not calculated'}
                </TableCell>
                <TableCell className="font-medium py-2 px-3">Payment Mode</TableCell>
                <TableCell className="py-2 px-3">
                  {surgery.isCashless ? (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Cashless</Badge>
                  ) : surgery.isReimbursement ? (
                    <Badge className="bg-purple-100 text-purple-800 text-xs">Reimbursement</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 text-xs">Cash</Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Claim Status</TableCell>
                <TableCell className="py-2 px-3">
                  {surgery.claimStatus ? (
                    <Badge className={`text-xs ${
                      surgery.claimStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      surgery.claimStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      surgery.claimStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {surgery.claimStatus}
                    </Badge>
                  ) : (
                    <span className="text-gray-500 text-sm">Not submitted</span>
                  )}
                </TableCell>
                <TableCell className="font-medium py-2 px-3">Claim Amount Sanctioned</TableCell>
                <TableCell className="py-2 px-3 font-medium">
                  {surgery.claimAmountSanctioned ? `₹${surgery.claimAmountSanctioned.toLocaleString()}` : 'N/A'}
                </TableCell>
              </TableRow>
              {/* Payment Breakdown for Cashless Approved Claims */}
              {surgery.isCashless && surgery.claimStatus === 'APPROVED' && surgery.finalSurgeryAmount && surgery.claimAmountSanctioned && (
                <TableRow className="border-b border-gray-100 bg-green-50">
                  <TableCell className="font-medium py-2 px-3 text-green-800">Patient Payable Amount</TableCell>
                  <TableCell className="py-2 px-3 font-bold text-green-800">
                    ₹{(surgery.finalSurgeryAmount - surgery.claimAmountSanctioned).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium py-2 px-3 text-green-800">Insurance Coverage</TableCell>
                  <TableCell className="py-2 px-3 font-medium text-green-800">
                    ₹{surgery.claimAmountSanctioned.toLocaleString()}
                  </TableCell>
                </TableRow>
              )}

              {/* System Information */}
              <TableRow className="border-b">
                <TableCell colSpan={4} className="font-medium text-gray-900 py-2 px-3 bg-gray-50">
                  System Information
                </TableCell>
              </TableRow>
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium py-2 px-3">Surgery ID</TableCell>
                <TableCell className="py-2 px-3 font-mono text-xs">{surgery.id}</TableCell>
                <TableCell className="font-medium py-2 px-3">Created Date</TableCell>
                <TableCell className="py-2 px-3">{format(new Date(surgery.admissionDate), 'dd MMM yyyy, HH:mm')}</TableCell>
              </TableRow>
              {surgery.updatedAt && (
                <TableRow className="border-b border-gray-100">
                  <TableCell className="font-medium py-2 px-3">Last Updated</TableCell>
                  <TableCell colSpan={3} className="py-2 px-3">{format(new Date(surgery.updatedAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium py-2 px-3">Notes</TableCell>
                <TableCell colSpan={3} className="py-2 px-3">{surgery.notes || 'No additional notes'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SurgeryDetailsModal;