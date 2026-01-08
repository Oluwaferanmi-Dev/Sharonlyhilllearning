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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  created_at: string;
  role: string;
  profile_picture_url?: string;
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
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-end">
        {/* Department Filter */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
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
        <div className="flex flex-col gap-2 w-full sm:w-auto">
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

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                Picture
              </th>
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
                  colSpan={7}
                  className="px-6 py-8 text-center text-slate-500 text-sm"
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
              const initials =
                `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();

              return (
                <tr
                  key={staff.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={staff.profile_picture_url || ""}
                        alt={`${staff.first_name} ${staff.last_name}`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {staff.first_name} {staff.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {staff.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {staff.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {completed}/{staffAssessments.length} completed
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
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

      {/* Mobile Card View - Visible only on mobile */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedStaff.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {selectedDepartment !== "all"
              ? `No staff members in ${selectedDepartment} department`
              : "No staff members have registered yet"}
          </div>
        ) : (
          filteredAndSortedStaff.map((staff) => {
            const staffAssessments =
              allAssessments.filter((a) => a.user_id === staff.id) || [];
            const completed = staffAssessments.filter(
              (a) => a.status === "completed"
            ).length;
            const initials =
              `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();

            return (
              <div
                key={staff.id}
                className="border border-slate-200 rounded-lg p-4 space-y-4 bg-white hover:shadow-md transition-shadow"
              >
                {/* Header with Avatar and Name */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={staff.profile_picture_url || ""}
                      alt={`${staff.first_name} ${staff.last_name}`}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {staff.first_name} {staff.last_name}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {staff.email}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Department</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {staff.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Topics</p>
                    <p className="text-sm font-medium text-slate-900">
                      {completed}/{staffAssessments.length}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600 mb-1">Joined</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(staff.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/admin/staff/${staff.id}`} className="block">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
