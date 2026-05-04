"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { RequisitionsToolbar } from "./components/requisitions-toolbar";
import { RequisitionsTable } from "./components/requisitions-table";
import { ApplicantsTable } from "./components/applicants-table";
import { RequisitionModal } from "./components/requisition-modal";
import { JOB_REQUISITIONS, APPLICANTS } from "./data";
import type {
  JobRequisition,
  NewJobRequisition,
  Applicant,
  ApplicationStage,
} from "./types";

export function RecruitmentPage() {
  const [requisitions, setRequisitions] =
    useState<JobRequisition[]>(JOB_REQUISITIONS);
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS);

  const [activeTab, setActiveTab] = useState("requisitions");

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [applicantSearch, setApplicantSearch] = useState("");
  const [applicantStageFilter, setApplicantStageFilter] = useState("all");
  const [applicantReqFilter, setApplicantReqFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<JobRequisition | null>(null);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      const matchSearch =
        !search ||
        r.positionTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase()) ||
        r.hiringManager.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || r.department === deptFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [requisitions, search, deptFilter, statusFilter]);

  const requisitionTitles = useMemo(
    () => [...new Set(applicants.map((a) => a.requisitionTitle))].sort(),
    [applicants],
  );

  const filteredApplicants = useMemo(() => {
    return applicants.filter((a) => {
      const matchSearch =
        !applicantSearch ||
        a.name.toLowerCase().includes(applicantSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(applicantSearch.toLowerCase());
      const matchStage =
        applicantStageFilter === "all" || a.stage === applicantStageFilter;
      const matchReq =
        applicantReqFilter === "all" ||
        a.requisitionTitle === applicantReqFilter ||
        a.requisitionId === applicantReqFilter;
      return matchSearch && matchStage && matchReq;
    });
  }, [applicants, applicantSearch, applicantStageFilter, applicantReqFilter]);

  const handleAdd = () => {
    setEditingReq(null);
    setModalOpen(true);
  };

  const handleEdit = (req: JobRequisition) => {
    setEditingReq(req);
    setModalOpen(true);
  };

  const handleSave = (data: NewJobRequisition) => {
    if (editingReq) {
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === editingReq.id ? { ...editingReq, ...data } : r,
        ),
      );
      toast.success("Requisition updated");
    } else {
      const newReq: JobRequisition = {
        ...data,
        id: `req-${Date.now()}`,
        status: "pending_approval",
        createdAt: new Date().toISOString().slice(0, 10),
        applicantCount: 0,
      };
      setRequisitions((prev) => [newReq, ...prev]);
      toast.success("Requisition created and submitted for approval");
    }
    setModalOpen(false);
    setEditingReq(null);
  };

  const handleDelete = (id: string) => {
    setRequisitions((prev) => prev.filter((r) => r.id !== id));
    toast.success("Requisition deleted");
  };

  const handleApprove = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    toast.success("Requisition approved");
  };

  const handleReject = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
    );
    toast.info("Requisition rejected");
  };

  const handleClose = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "closed" } : r)),
    );
    toast.info("Role closed");
  };

  const handleViewApplicants = (req: JobRequisition) => {
    setApplicantReqFilter(req.positionTitle);
    setActiveTab("applicants");
  };

  const handleStageChange = (id: string, stage: ApplicationStage) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage } : a)),
    );
    toast.success(`Applicant moved to ${stage.replace(/_/g, " ")}`);
  };

  const handleRejectApplicant = (id: string) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage: "rejected" } : a)),
    );
    toast.info("Applicant rejected");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Recruitment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage job requisitions and track applicants through the hiring
          pipeline.
        </p>
      </div>

      <StatCards requisitions={requisitions} applicants={applicants} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col gap-4"
      >
        <PageTabsList
          tabs={[
            { value: "requisitions", label: "Requisitions" },
            { value: "applicants", label: "Applicants" },
          ]}
        />

        <TabsContent value="requisitions" className="mt-0 flex flex-col gap-4">
          <RequisitionsToolbar
            search={search}
            onSearchChange={setSearch}
            deptFilter={deptFilter}
            onDeptFilterChange={setDeptFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={handleAdd}
          />
          <RequisitionsTable
            requisitions={filteredRequisitions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            onClose={handleClose}
            onViewApplicants={handleViewApplicants}
          />
        </TabsContent>

        <TabsContent value="applicants" className="mt-0 flex flex-col gap-4">
          <ApplicantsTable
            applicants={filteredApplicants}
            onStageChange={handleStageChange}
            onReject={handleRejectApplicant}
            search={applicantSearch}
            onSearchChange={setApplicantSearch}
            stageFilter={applicantStageFilter}
            onStageFilterChange={setApplicantStageFilter}
            requisitionFilter={applicantReqFilter}
            onRequisitionFilterChange={setApplicantReqFilter}
            requisitionTitles={requisitionTitles}
          />
        </TabsContent>
      </Tabs>

      <RequisitionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingReq(null);
        }}
        editingRequisition={editingReq}
        onSave={handleSave}
      />
    </div>
  );
}
