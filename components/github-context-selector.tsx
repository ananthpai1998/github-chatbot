"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GithubIcon } from "./icons";
import { useGitHubToken } from "@/hooks/use-github-token";
import {
  searchRepositories,
  fetchRepositoryBranches,
  type GitHubRepository,
  type GitHubBranch,
} from "@/lib/api/github";
import { Search, X, Loader2 } from "lucide-react";

export function GitHubContextSelector() {
  const { getToken, isLoaded } = useGitHubToken();
  const hasToken = !!getToken();

  const [searchQuery, setSearchQuery] = useState("");
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    async (query: string) => {
      const token = getToken();
      if (!token) return;

      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchRepositories(query, token, {
          limit: 30,
          sort: "updated",
          order: "desc",
        });
        setRepositories(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Failed to search repositories. Please try again.");
        setRepositories([]);
      } finally {
        setIsSearching(false);
      }
    },
    [getToken]
  );

  // Handle search input with debouncing
  useEffect(() => {
    if (!hasToken) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 1000);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, hasToken, performSearch]);

  // Load initial repositories when popover opens
  useEffect(() => {
    if (isOpen && hasToken && repositories.length === 0) {
      performSearch("");
    }
  }, [isOpen, hasToken, performSearch, repositories.length]);

  // Fetch branches when first repository is selected
  useEffect(() => {
    const fetchBranches = async () => {
      if (selectedRepos.length === 0) {
        setBranches([]);
        return;
      }

      const token = getToken();
      if (!token) return;

      setIsLoadingBranches(true);
      try {
        const firstRepo = selectedRepos[0];
        const branchList = await fetchRepositoryBranches(
          firstRepo.owner.login,
          firstRepo.name,
          token
        );
        setBranches(branchList);

        // Set default branch if not already set
        if (!selectedBranch && branchList.length > 0) {
          const mainBranch = branchList.find(
            (b) => b.name === "main" || b.name === "master"
          );
          setSelectedBranch(mainBranch?.name || branchList[0].name);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches([]);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [selectedRepos, getToken, selectedBranch]);

  const handleRepoToggle = (repo: GitHubRepository) => {
    setSelectedRepos((prev) => {
      const exists = prev.find((r) => r.id === repo.id);
      if (exists) {
        return prev.filter((r) => r.id !== repo.id);
      } else {
        return [...prev, repo];
      }
    });
  };

  const handleRemoveRepo = (repoId: number) => {
    setSelectedRepos((prev) => prev.filter((r) => r.id !== repoId));
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedRepos([]);
    setSelectedBranch("main");
    setBranches([]);
  };

  const handleApply = () => {
    if (selectedRepos.length > 0) {
      console.log("GitHub Context Applied:", {
        repos: selectedRepos.map((r) => r.full_name),
        branch: selectedBranch,
      });
      // TODO: Store context and use in chat
      setIsOpen(false);
    }
  };

  // Always show the button, but change behavior based on token
  if (!isLoaded) {
    return null; // Don't render until we know if token exists (prevents SSR issues)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
          variant="ghost"
          data-testid="github-context-button"
          title="GitHub Context"
        >
          <GithubIcon size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start" side="top">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">GitHub Context</h4>
            <p className="text-xs text-muted-foreground">
              Search and select repositories for context
            </p>
          </div>

          {!hasToken ? (
            <div className="space-y-3">
              <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  GitHub Token Required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please configure your GitHub Personal Access Token in Settings
                  to use this feature.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = "/settings";
                }}
              >
                Go to Settings
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {/* Search Input */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-xs">
                    Search Repositories
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="owner/repo or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 pr-8 text-sm"
                    />
                    {(searchQuery || isSearching) && (
                      <div className="absolute right-2 top-2">
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {searchError && (
                    <p className="text-xs text-red-500">{searchError}</p>
                  )}
                </div>

                {/* Selected Repositories */}
                {selectedRepos.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Selected ({selectedRepos.length})
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedRepos.map((repo) => (
                        <div
                          key={repo.id}
                          className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs"
                        >
                          <span className="max-w-[200px] truncate">
                            {repo.full_name}
                          </span>
                          <button
                            onClick={() => handleRemoveRepo(repo.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repository List */}
                <div className="space-y-2">
                  <Label className="text-xs">
                    Available Repositories
                  </Label>
                  <div className="rounded-md border border-input bg-background">
                    {repositories.length === 0 && !isSearching ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        {searchQuery
                          ? "No repositories found"
                          : "Start typing to search..."}
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                        {repositories.map((repo) => {
                          const isSelected = selectedRepos.some(
                            (r) => r.id === repo.id
                          );
                          return (
                            <div
                              key={repo.id}
                              className={`flex items-start space-x-2 p-2 rounded hover:bg-accent cursor-pointer ${
                                isSelected ? "bg-accent" : ""
                              }`}
                              onClick={() => handleRepoToggle(repo)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleRepoToggle(repo)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {repo.full_name}
                                </div>
                                {repo.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {repo.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {repo.language && (
                                    <span className="text-xs text-muted-foreground">
                                      {repo.language}
                                    </span>
                                  )}
                                  {repo.private && (
                                    <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1 rounded">
                                      Private
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Selection */}
                {selectedRepos.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-xs">
                      Branch
                    </Label>
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                      disabled={isLoadingBranches}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        {isLoadingBranches ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading branches...
                          </span>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            <div className="flex items-center gap-2">
                              {branch.name}
                              {branch.protected && (
                                <span className="text-xs text-muted-foreground">
                                  (protected)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={selectedRepos.length === 0}
                  className="h-7 text-xs"
                >
                  Apply
                </Button>
              </div>

              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Search using owner/repo format (e.g., "facebook/react")
                  or keywords to find repositories you have access to.
                </p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
