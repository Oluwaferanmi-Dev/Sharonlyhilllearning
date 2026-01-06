"use client";

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  created_at: string;
  role: string;
}

interface Assessment {
  user_id: string;
  status: string;
}

interface Props {
  staffProfiles: StaffMember[];
  allAssessments: Assessment[];
}

export default function StaffFiltersAndTable({
  staffProfiles,
  allAssessments,
}: Props) {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateSort, setDateSort] = useState<"latest" | "earliest">("latest");

  const uniqueDepartments = useMemo(
    () =>
      Array.from(
        new Set(staffProfiles.map((staff) => staff.department).filter(Boolean))
      ).sort(),
    [staffProfiles]
  );

  const filteredAndSortedStaff = useMemo(() => {
    const filtered = staffProfiles.filter((staff) => {
      if (selectedDepartment === "all") return true;
      return staff.department === selectedDepartment;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === "latest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [staffProfiles, selectedDepartment, dateSort]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
        {/* Department Filter */}
        <div className="flex flex-col gap-2 flex-1 sm:flex-initial">
          <label className="text-sm font-medium text-slate-700">
            Filter by Department
          </label>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Sort Filter */}
        <div className="flex flex-col gap-2 flex-1 sm:flex-initial">
          <label className="text-sm font-medium text-slate-700">
            Sort by Join Date
          </label>
          <Select
            value={dateSort}
            onValueChange={(value) =>
              setDateSort(value as "latest" | "earliest")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                Latest Joined (Newest First)
              </SelectItem>
              <SelectItem value="earliest">
                Earliest Joined (Oldest First)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Name
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Department
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Topics
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Joined
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAndSortedStaff.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {selectedDepartment !== "all"
                    ? `No staff members in ${selectedDepartment} department`
                    : "No staff members have registered yet"}
                </td>
              </tr>
            )}
            {filteredAndSortedStaff.map((staff) => {
              const staffAssessments =
                allAssessments.filter((a) => a.user_id === staff.id) || [];
              const completed = staffAssessments.filter(
                (a) => a.status === "completed"
              ).length;

              return (
                <tr
                  key={staff.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {staff.first_name} {staff.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {staff.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {staff.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {completed}/{staffAssessments.length} completed
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(staff.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/staff/${staff.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-transparent"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedStaff.length === 0 && (
          <div className="text-center py-8 text-slate-500 border border-slate-200 rounded-lg">
            {selectedDepartment !== "all"
              ? `No staff members in ${selectedDepartment} department`
              : "No staff members have registered yet"}
          </div>
        )}
        {filteredAndSortedStaff.map((staff) => {
          const staffAssessments =
            allAssessments.filter((a) => a.user_id === staff.id) || [];
          const completed = staffAssessments.filter(
            (a) => a.status === "completed"
          ).length;

          return (
            <div
              key={staff.id}
              className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {staff.first_name} {staff.last_name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{staff.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Department:</span>
                  <p className="text-slate-900 font-medium">
                    {staff.department}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Topics:</span>
                  <p className="text-slate-900 font-medium">
                    {completed}/{staffAssessments.length} completed
                  </p>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                Joined {new Date(staff.created_at).toLocaleDateString()}
              </div>

              <Link href={`/admin/staff/${staff.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
